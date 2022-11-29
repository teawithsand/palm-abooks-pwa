import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import {
	SeekData,
	SeekDiscardCondition,
	SeekType,
} from "@app/domain/defines/seek"
import { WhatToPlayData } from "@app/domain/defines/whatToPlay/data"
import { ConfigManager } from "@app/domain/managers/config"
import { SeekEventType, SeekQueue } from "@app/domain/managers/player/seekQueue"
import { PositionAndSeekDataResolver } from "@app/domain/managers/position/positionAndSeekDataResolver"
import { PositionMoveAfterPauseManager } from "@app/domain/managers/position/positionMoveAfterPauseHelper"
import {
	computeJumpBackTimeAfterPauseDuration,
	DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY,
} from "@app/domain/managers/position/positionMoveAfterPauseStrategy"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlay/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"
import {
	CollectionPlayerSourceProvider,
	MapPlayerSourceProvider,
	Player,
	PlayerConfig,
	PlayerState,
} from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	generateUUID,
	getNowPerformanceTimestamp,
	getNowTimestamp,
	MediaSessionApiHelper,
	PerformanceTimestampMs,
	StickyEventBus,
	StickySubscribable,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export enum PositionLoadingState {
	IDLE = 0,
	LOADING = 1,
	LOADED = 2,
	NOT_FOUND = 3,
	ERROR = 4,
}

const LOADING_POSITION_SEEK_DELTA_MS = 2000

export type PlayerManagerState = {
	innerState: PlayerState<PlayableEntry, string>
	/**
	 * @deprecated use what to play data instead
	 */
	sources: PlayableEntry[]
	whatToPlayData: WhatToPlayData | null
	positionLoadingState: PositionLoadingState

	// TODO(teawithsand): add more entries here
}

export class PlayerManager {
	private readonly mediaSessionManager = MediaSessionApiHelper.instance
	private readonly player: Player<PlayableEntry, string>

	private readonly innerPlayerStateBus: StickyEventBus<PlayerManagerState>

	public get playerStateBus(): StickySubscribable<PlayerManagerState> {
		return this.innerPlayerStateBus
	}

	public readonly seekQueue = new SeekQueue(this)
	public readonly resolver = new PositionAndSeekDataResolver()

	constructor(
		db: AbookDb,
		configManager: ConfigManager,
		whatToPlayManager: WhatToPlayManager
	) {
		whatToPlayManager.bus.addSubscriber((data) => {
			this.setWhatToPlayData(data)
		})
		this.player = new Player<PlayableEntry, string>(
			new PlayableEntryPlayerSourceResolver(db)
		)
		this.innerPlayerStateBus =
			new DefaultStickyEventBus<PlayerManagerState>({
				innerState: this.player.stateBus.lastEvent,
				sources: [],
				whatToPlayData: null,
				positionLoadingState: PositionLoadingState.IDLE,
			})

		this.player.stateBus.addSubscriber((state) => {
			this.mediaSessionManager.setPositionState({
				duration: state.duration,
				playbackRate: state.config.speed || 1, // TODO(teawithsand): debug why during init it can be zero
				position: state.position ?? 0,
			})

			this.mediaSessionManager.setPlaybackState(
				state.config.sourceKey === null
					? "none"
					: state.config.isPlayingWhenReady // or isPlaying here?
					? "playing"
					: "paused"
			)
		})

		this.player.stateBus.addSubscriber((state) => {
			this.innerPlayerStateBus.emitEvent(
				produce(this.innerPlayerStateBus.lastEvent, (draft) => {
					draft.innerState = state
				})
			)
		})

		this.player.mutateConfig((draft) => {
			draft.volume = 1
			draft.speed = 1
			draft.sourceKey = null
			draft.isPlayingWhenReady = false
			draft.forceReloadOnSourceProviderSwap = false // ids of PlayableEntry must be unique anyway, so this is ok
		})

		configManager.globalPlayerConfig.bus.addSubscriber((cfg) => {
			if (!cfg) return

			this.player.mutateConfig((draft) => {
				draft.speed = cfg.speed
			})
		})
	}

	private setWhatToPlayData = (whatToPlayData: WhatToPlayData | null) => {
		this.seekQueue.clear()

		// TODO(teawithsand): ensure that WTP id always changes

		const sources = whatToPlayData?.entriesBag?.entries ?? []

		// this is the only kind of SP that we are setting, so this cast is valid
		const currentProvider = this.player.stateBus.lastEvent.config
			.sourceProvider as unknown as CollectionPlayerSourceProvider<PlayableEntry>

		const currentSourcesIds = new Set(
			(currentProvider?.sources ?? []).map((v) => v.id)
		)
		const newSourcesIds = new Set(sources.map((s) => s.id))

		if (
			currentSourcesIds.size === newSourcesIds.size &&
			[...currentSourcesIds].every((x) => newSourcesIds.has(x))
		) {
			return // If ids didn't change source set this operation is no-op, so end early
		}

		const src = new MapPlayerSourceProvider(sources, (s) => s.id)
		const key = src.getNextSourceKey(null)

		let initPositionLoadingState: PositionLoadingState =
			PositionLoadingState.NOT_FOUND

		let seekData: SeekData | null = null

		if (whatToPlayData && whatToPlayData.positionToLoad) {
			seekData = this.resolver.resolvePositionVariants(
				{
					entriesBag: whatToPlayData.entriesBag,
					metadataBag: whatToPlayData.metadata,
				},
				whatToPlayData.positionToLoad.variants
			)
			
			if (!seekData) {
				initPositionLoadingState = PositionLoadingState.ERROR
			} else {
				initPositionLoadingState = PositionLoadingState.LOADING
			}
		}

		this.innerPlayerStateBus.emitEvent(
			produce(this.innerPlayerStateBus.lastEvent, (draft) => {
				draft.whatToPlayData = whatToPlayData
				draft.sources = sources

				draft.positionLoadingState = initPositionLoadingState
				// HACK: update these two in single stroke, so they are in sync with outer state.
				// In same JS tick we will update player, which will update these, so it's fine.
				//
				// To do this in non-hacky way I'd have to implement is-in-sync-logic
				// 	and update state only if it indeed is in sync
				draft.innerState.config.sourceProvider = src
				draft.innerState.config.sourceKey = key
			})
		)

		this.player.mutateConfig((draft) => {
			draft.sourceProvider = src
			draft.sourceKey = key
		})

		if (whatToPlayData && whatToPlayData.positionToLoad && seekData) {
			const now = getNowPerformanceTimestamp()
			const loadPositionSeekDeadline =
				now + LOADING_POSITION_SEEK_DELTA_MS
			const jumpBackAfterPauseSeekDeadline =
				loadPositionSeekDeadline + LOADING_POSITION_SEEK_DELTA_MS

			this.seekQueue
				.enqueueSeek({
					id: generateUUID(),
					deadlinePerfTimestamp:
						loadPositionSeekDeadline as PerformanceTimestampMs,
					discardCond: SeekDiscardCondition.NEVER, // always wait until deadline
					seekData: seekData,
				})
				.addSubscriber((event, unsubscribe) => {
					if (event === null) return

					unsubscribe()

					const last = this.innerPlayerStateBus.lastEvent
					if (last.whatToPlayData?.id === whatToPlayData.id) {
						// only if WTP didn't change
						this.innerPlayerStateBus.emitEvent(
							produce(last, (draft) => {
								draft.positionLoadingState =
									event.type === SeekEventType.PERFORMED
										? PositionLoadingState.LOADED
										: PositionLoadingState.ERROR
							})
						)
					}
				})

			// TODO(teawithsand): remove this abs
			const deltaTime = Math.abs(
				computeJumpBackTimeAfterPauseDuration(
					DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY,
					getNowTimestamp() -
						whatToPlayData.positionToLoad.savedTimestamp
				)
			)

			// TODO(teawithsand): We notify external users about whether position was loaded or not,
			// but we do not do so for this JBAP seek, which is unsound.
			if (deltaTime > 0) {
				this.seekQueue.enqueueSeek({
					id: generateUUID(),
					deadlinePerfTimestamp:
						jumpBackAfterPauseSeekDeadline as PerformanceTimestampMs,
					discardCond: SeekDiscardCondition.NEVER, // always wait until deadline,
					seekData: {
						type: SeekType.RELATIVE_GLOBAL,
						positionDeltaMs: -deltaTime,
					},
				})
			}
		}
	}

	/**
	 * Note: this method is a hack and it's not safe to mutate all fields in config that user's is given.
	 * Only playback stuff like isPlayingWhenReady, speed and so on are safe to touch.
	 */
	mutateConfig = (
		mutator: (draft: Draft<PlayerConfig<PlayableEntry, string>>) => void
	) => {
		this.player.mutateConfig(mutator)
	}
}

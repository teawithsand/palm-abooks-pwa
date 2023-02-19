import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import {
	SeekData,
	SeekDiscardCondition,
	SeekType,
} from "@app/domain/defines/seek"
import { WhatToPlayData } from "@app/domain/defines/whatToPlay/data"
import { WhatToPlayStateType } from "@app/domain/defines/whatToPlay/state"
import { ConfigManager } from "@app/domain/managers/config"
import { SeekEventType, SeekQueue } from "@app/domain/managers/player/seekQueue"
import { PositionAndSeekDataResolver } from "@app/domain/managers/position/positionAndSeekDataResolver"
import {
	DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY,
	computeJumpBackTimeAfterPauseDuration,
} from "@app/domain/managers/position/positionMoveAfterPauseStrategy"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlay/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"
import {
	MapPlayerSourceProvider,
	Player,
	PlayerConfig,
	PlayerState,
} from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	MediaSessionApiHelper,
	PerformanceTimestampMs,
	StickyEventBus,
	StickySubscribable,
	generateUUID,
	getNowPerformanceTimestamp,
	getNowTimestamp,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export enum PositionLoadingState {
	IDLE = 0,
	LOADING = 1,
	LOADED = 2,
	NOT_FOUND = 3,
	ERROR = 4,
}

const LOADING_POSITION_SEEK_TIMEOUT_MS = 2000

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

/**
 * @deprecated To be replaced with new player manager
 */
export class PlayerManager {
	private readonly mediaSessionManager = MediaSessionApiHelper.instance
	private readonly player: Player<PlayableEntry, string>

	private readonly innerPlayerStateBus: StickyEventBus<PlayerManagerState>

	public get playerStateBus(): StickySubscribable<PlayerManagerState> {
		return this.innerPlayerStateBus
	}

	public readonly seekQueue: SeekQueue
	public readonly resolver = new PositionAndSeekDataResolver()

	constructor(
		db: AbookDb,
		configManager: ConfigManager,
		whatToPlayManager: WhatToPlayManager
	) {
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

		this.seekQueue = new SeekQueue(this)

		whatToPlayManager.stateBus.addSubscriber((data) => {
			if (data.type === WhatToPlayStateType.LOADED) {
				this.setWhatToPlayData(data.data)
			} else {
				this.setWhatToPlayData(null)
			}
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

	private onNewWhatToPlayDataSet = (whatToPlayData: WhatToPlayData) => {
		this.seekQueue.clear()

		let initPositionLoadingState: PositionLoadingState =
			PositionLoadingState.NOT_FOUND

		let seekData: SeekData | null = null

		if (whatToPlayData.positionToLoad) {
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

		this.onWhatToPlayDataDifferentSourcesOverride(
			whatToPlayData,
			initPositionLoadingState
		)

		if (whatToPlayData.positionToLoad && seekData) {
			const nowPerf = getNowPerformanceTimestamp()

			const loadPositionSeekDeadline =
				nowPerf + LOADING_POSITION_SEEK_TIMEOUT_MS
			const jumpBackAfterPauseSeekDeadline =
				loadPositionSeekDeadline + LOADING_POSITION_SEEK_TIMEOUT_MS // deadline AFTER 1st seek is done

			// TODO(teawithsand): remove this abs once ensured it's safe to do so(as it should be)
			const deltaTime = Math.abs(
				computeJumpBackTimeAfterPauseDuration(
					DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY,
					getNowTimestamp() -
						whatToPlayData.positionToLoad.savedTimestamp
				)
			)

			const willTrySecondSeek = deltaTime > 0

			let firstSeekResult: SeekEventType | null = null

			const wasSeekSuccessful = (res: SeekEventType | null) =>
				res === SeekEventType.PERFORMED

			const sendDoneEvent = (ok: boolean) => {
				const last = this.innerPlayerStateBus.lastEvent

				this.innerPlayerStateBus.emitEvent(
					produce(last, (draft) => {
						draft.positionLoadingState = ok
							? PositionLoadingState.LOADED
							: PositionLoadingState.ERROR
					})
				)
			}

			const onFirstSeekDone = (type: SeekEventType) => {
				firstSeekResult = type
				const isSuccess = wasSeekSuccessful(type)

				if (!willTrySecondSeek) {
					sendDoneEvent(isSuccess)
				}
			}
			const onSecondSeekDone = (type: SeekEventType) => {
				// if first seek filed, then this will be discarded
				// with info that this seek was discarded due to cond used
				// in other words, this is ok.
				sendDoneEvent(wasSeekSuccessful(type))
			}

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

					// can be done here, as no matter which event comes, we want to quit subscribing anyway
					// although it's not required
					unsubscribe()

					const last = this.innerPlayerStateBus.lastEvent
					if (last.whatToPlayData?.id === whatToPlayData.id) {
						// only if WTP didn't change
						onFirstSeekDone(event.type)
					}
				})

			if (willTrySecondSeek) {
				this.seekQueue
					.enqueueSeek({
						id: generateUUID(),
						deadlinePerfTimestamp:
							jumpBackAfterPauseSeekDeadline as PerformanceTimestampMs,
						discardCond: SeekDiscardCondition.NEVER, // always wait until deadline,
						seekData: {
							type: SeekType.RELATIVE_GLOBAL,
							positionDeltaMs: -deltaTime,
						},
						immediateExecCond: () =>
							wasSeekSuccessful(firstSeekResult),
					})
					.addSubscriber((event, unsubscribe) => {
						if (event === null) return

						// can be done here, as no matter which event comes, we want to quit subscribing anyway
						unsubscribe()

						const last = this.innerPlayerStateBus.lastEvent
						if (last.whatToPlayData?.id === whatToPlayData.id) {
							// only if WTP didn't change

							onSecondSeekDone(event.type)
						}
					})
			}
		}
	}

	private onWhatToPlayDataSameSourcesOverride = (
		whatToPlayData: WhatToPlayData
	) => {
		this.innerPlayerStateBus.emitEvent(
			produce(this.innerPlayerStateBus.lastEvent, (draft) => {
				draft.whatToPlayData = whatToPlayData
				draft.sources = whatToPlayData.entriesBag.entries
			})
		)
	}

	private onWhatToPlayDataDifferentSourcesOverride = (
		whatToPlayData: WhatToPlayData,
		positionLoadingState: PositionLoadingState | null = null
	) => {
		const src = new MapPlayerSourceProvider(
			whatToPlayData.entriesBag.entries,
			(s) => s.id
		)
		const key = src.getNextSourceKey(null)

		this.innerPlayerStateBus.emitEvent(
			produce(this.innerPlayerStateBus.lastEvent, (draft) => {
				draft.whatToPlayData = whatToPlayData
				draft.sources = whatToPlayData.entriesBag.entries

				if (positionLoadingState !== null) {
					draft.positionLoadingState = positionLoadingState
				}

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
	}

	private onWhatToPlayDataUnset = () => {
		this.seekQueue.clear()

		this.innerPlayerStateBus.emitEvent(
			produce(this.innerPlayerStateBus.lastEvent, (draft) => {
				draft.whatToPlayData = null
				draft.sources = []
				draft.positionLoadingState = PositionLoadingState.IDLE

				// HACK: update these two in single stroke, so they are in sync with outer state.
				// In same JS tick we will update player, which will update these, so it's fine.
				//
				// To do this in non-hacky way I'd have to implement is-in-sync-logic
				// 	and update state only if it indeed is in sync
				draft.innerState.config.sourceProvider =
					new MapPlayerSourceProvider<PlayableEntry>([], (s) => s.id)
				draft.innerState.config.sourceKey = null
			})
		)
	}

	private isWhatToPlayDataSame = (
		oldWhatToPlayData: WhatToPlayData,
		newWhatToPlayData: WhatToPlayData
	) => {
		const newSources = newWhatToPlayData.entriesBag.entries ?? []

		// this is the only kind of SP that we are setting, so this cast is valid
		const oldSources = oldWhatToPlayData.entriesBag.entries ?? []

		const oldSourcesIds = new Set((oldSources ?? []).map((v) => v.id))
		const newSourcesIds = new Set(newSources.map((s) => s.id))

		return (
			oldSourcesIds.size === newSourcesIds.size &&
			[...oldSourcesIds].every((x) => newSourcesIds.has(x))
		)
	}

	private setWhatToPlayData = (newWhatToPlayData: WhatToPlayData | null) => {
		const oldWhatToPlayData =
			this.innerPlayerStateBus.lastEvent.whatToPlayData

		if (!newWhatToPlayData) {
			this.onWhatToPlayDataUnset()
		} else if (
			!oldWhatToPlayData ||
			oldWhatToPlayData?.id !== newWhatToPlayData.id
		) {
			this.onNewWhatToPlayDataSet(newWhatToPlayData)
		} else {
			if (
				this.isWhatToPlayDataSame(oldWhatToPlayData, newWhatToPlayData)
			) {
				this.onWhatToPlayDataSameSourcesOverride(newWhatToPlayData)
			} else {
				this.onWhatToPlayDataDifferentSourcesOverride(newWhatToPlayData)
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

import { SeekBackStrategyDataType } from "@app/domain/defines/player/seekBack/defines"
import { SeekBackStrategyEntity } from "@app/domain/defines/player/seekBack/strategy"
import {
	PlayerEntryListMetadata,
	PlayerEntryListMetadataType,
} from "@app/domain/managers/newPlayer/list/metadata"
import {
	PlayerEntryListManager,
	PlayerEntryListManagerState,
} from "@app/domain/managers/newPlayer/list/playerEntryListManager"
import {
	PlayerPositionLoader,
	PositionLoadingState,
} from "@app/domain/managers/newPlayer/player/playerPositionLoader"
import { PlayerPositionSaver } from "@app/domain/managers/newPlayer/player/playerPositionSaver"
import { NewSeekQueue } from "@app/domain/managers/newPlayer/player/seekQueue"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { AbookDb } from "@app/domain/storage/db"
import { Player, PlayerConfig, PlayerState } from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	StickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
	generateUUID,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export type NewPlayerManagerState = {
	playerState: PlayerState
	playerEntryListManagerState: PlayerEntryListManagerState

	positionLoadingState: PositionLoadingState
}

export class NewPlayerManager {
	private readonly player: Player
	private readonly innerBus: StickyEventBus<NewPlayerManagerState>

	public get bus(): StickySubscribable<NewPlayerManagerState> {
		return this.innerBus
	}

	public readonly seekQueue: NewSeekQueue

	private previousMetadata: PlayerEntryListMetadata =
		new PlayerEntryListMetadata({
			type: PlayerEntryListMetadataType.UNKNOWN,
		})
	private previousListId = generateUUID()
	private currentPositionLoaderShutdown: SubscriptionCanceler = () => {}
	private positionSaver: PlayerPositionSaver

	private onNewMetadata = (
		metadata: PlayerEntryListMetadata,
		entries: PlayerEntriesBag
	) => {
		this.currentPositionLoaderShutdown()

		const loader = new PlayerPositionLoader(
			metadata,
			entries,
			new SeekBackStrategyEntity({
				type: SeekBackStrategyDataType.NONE,
			})
		)
		const unsubscribe = loader.bus.addSubscriber((state) => {
			this.innerBus.emitEvent(
				produce(this.innerBus.lastEvent, (draft) => {
					draft.positionLoadingState = state.state
				})
			)
		})

		this.currentPositionLoaderShutdown = () => {
			loader.close()
			unsubscribe()
		}

		loader.begin(this.seekQueue)
	}

	private onNewEntries = (
		metadata: PlayerEntryListMetadata,
		entries: PlayerEntriesBag
	) => {
		this.positionSaver.requestImmediateSave() // runs on previous metadata; request immediate saver
		this.positionSaver.close()
		this.positionSaver = new PlayerPositionSaver(
			entries,
			metadata,
			this.abookDb
		)

		this.seekQueue.clear() // must be called AFTER PlayerPositionLoader.begin call
	}

	private onMaybeUpdatedEntries = (
		metadata: PlayerEntryListMetadata,
		entries: PlayerEntriesBag
	) => {
		// for now noop
	}

	constructor(
		playerEntryListManager: PlayerEntryListManager,
		private readonly abookDb: AbookDb
	) {
		const player = new Player()
		this.seekQueue = new NewSeekQueue(player, (id) => {
			playerEntryListManager.goToEntry(id)
		})
		this.player = player
		this.innerBus = new DefaultStickyEventBus({
			playerEntryListManagerState: playerEntryListManager.bus.lastEvent,
			playerState: player.stateBus.lastEvent,
			positionLoadingState: PositionLoadingState.NOT_FOUND,
		})
		this.positionSaver = new PlayerPositionSaver(
			new PlayerEntriesBag([]),
			new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.UNKNOWN,
			}),
			abookDb
		)

		let handledIsEnded = false
		player.stateBus.addSubscriber((state) => {
			if (state.isEnded && state.config.isPlayingWhenReady) {
				if (!handledIsEnded) {
					handledIsEnded = true
					playerEntryListManager.goToNext()
				}
			} else {
				handledIsEnded = false
			}

			this.innerBus.emitEvent(
				produce(this.innerBus.lastEvent, (draft) => {
					draft.playerState = state
				})
			)
		})

		playerEntryListManager.bus.addSubscriber((state) => {
			if (state.listState.id !== this.previousListId) {
				this.previousListId = state.listState.id

				this.onNewEntries(
					state.listMetadata,
					state.listState.entriesBag
				)
			} else {
				this.onMaybeUpdatedEntries(
					state.listMetadata,
					state.listState.entriesBag
				)
			}

			if (this.previousMetadata.id !== state.listMetadata.id) {
				this.onNewMetadata(
					state.listMetadata,
					state.listState.entriesBag
				)
			}

			this.innerBus.emitEvent(
				produce(this.innerBus.lastEvent, (draft) => {
					draft.playerEntryListManagerState = state
				})
			)

			const entry =
				state.currentEntryId !== null
					? state.listState.entriesBag.findById(state.currentEntryId)
					: null

			player.mutateConfig((draft) => {
				draft.source = entry?.source ?? null
			})
		})

		this.innerBus.addSubscriber((state) => {
			this.positionSaver.setPosition(
				state.playerEntryListManagerState.currentEntryId,
				state.playerState.position
			)

			// Save position on pause
			if (!state.playerState.isPlaying) {
				this.positionSaver.requestImmediateSave()
			}

			this.seekQueue.setResolutionData({
				currentEntryId:
					state.playerEntryListManagerState.currentEntryId,
				entriesBag:
					state.playerEntryListManagerState.listState.entriesBag,
				currentEntryPosition: state.playerState.position,
			})
		})
	}

	mutatePlayerConfig = (mutator: (draft: Draft<PlayerConfig>) => void) => {
		this.player.mutateConfig(mutator)
	}
}

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
import { PlayerPositionLoader } from "@app/domain/managers/newPlayer/player/playerPositionLoader"
import { NewSeekQueue } from "@app/domain/managers/newPlayer/player/seekQueue"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { PositionLoadingState } from "@app/domain/managers/player/playerManager"
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
	private currentLoaderShutdown: SubscriptionCanceler

	private onNewMetadata = (
		metadata: PlayerEntryListMetadata,
		entries: PlayerEntriesBag
	) => {
		this.currentLoaderShutdown()

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

		this.currentLoaderShutdown = () => {
			loader.close()
			unsubscribe()
		}

		loader.begin(this.seekQueue)
	}

	private onNewEntries = (entries: PlayerEntriesBag) => {
		// for now noop
	}

	private onMaybeUpdatedEntries = (entries: PlayerEntriesBag) => {
		// for now noop
	}

	constructor(playerEntryListManager: PlayerEntryListManager) {
		const player = new Player()
		this.player = player
		this.innerBus = new DefaultStickyEventBus({
			playerEntryListManagerState: playerEntryListManager.bus.lastEvent,
			playerState: player.stateBus.lastEvent,
			positionLoadingState: PositionLoadingState.NOT_FOUND,
		})

		this.currentLoaderShutdown = () => {}

		let handledIsEnded = false
		player.stateBus.addSubscriber((state) => {
			if (state.isEnded) {
				if (!handledIsEnded) {
					playerEntryListManager.goToNext()
				}
				handledIsEnded = true
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

				this.onNewEntries(state.listState.entriesBag)
			} else {
				this.onMaybeUpdatedEntries(state.listState.entriesBag)
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

		this.seekQueue = new NewSeekQueue(player)

		this.innerBus.addSubscriber((state) => {
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

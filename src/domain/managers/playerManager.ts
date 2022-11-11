import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { AbookDb } from "@app/domain/storage/db"
import {
	MapPlayerSourceProvider,
	Player,
	PlayerState,
} from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	MediaSessionApiHelper,
	MediaSessionEventType,
	StickyEventBus,
	StickySubscribable,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export type PlayerManagerConfig = {
	isPlayingWhenReady: boolean
	speed: number
	userVolume: number
	preservePitchForSpeed: boolean
}

export type PlayerManagerState = {
	config: PlayerManagerConfig
	innerState: PlayerState<string>

	sources: PlayableEntry[]

	// TODO(teawithsand): add more entries here
}

const emptySourceProvider = new MapPlayerSourceProvider<PlayableEntry>(
	[],
	(s) => s.id
)

export class PlayerManager {
	private readonly innerPlayerConfigBus =
		new DefaultStickyEventBus<PlayerManagerConfig>({
			isPlayingWhenReady: true,
			preservePitchForSpeed: false,
			speed: 1.3,
			userVolume: 1,
		})

	public get playerConfigBus(): StickySubscribable<PlayerManagerConfig> {
		return this.innerPlayerConfigBus
	}

	private readonly mediaSessionManager = MediaSessionApiHelper.instance
	private readonly player: Player<PlayableEntry, string>

	private readonly innerPlayerStateBus: StickyEventBus<PlayerManagerState>

	public get playerStateBus(): StickySubscribable<PlayerManagerState> {
		return this.innerPlayerStateBus
	}

	constructor(db: AbookDb) {
		this.player = new Player<PlayableEntry, string>(
			new MapPlayerSourceProvider<PlayableEntry>([], (s) => s.id),
			new PlayableEntryPlayerSourceResolver(db)
		)
		this.innerPlayerStateBus =
			new DefaultStickyEventBus<PlayerManagerState>({
				config: this.innerPlayerConfigBus.lastEvent,
				innerState: this.player.stateBus.lastEvent,
				sources: [],
			})

		this.mediaSessionManager.setSupportedActions(["play", "pause"])
		this.mediaSessionManager.eventBus.addSubscriber((event) => {
			if (event.type === MediaSessionEventType.PAUSE) {
				this.mutateConfig((draft) => {
					draft.isPlayingWhenReady = false
				})
			} else if (event.type === MediaSessionEventType.PLAY) {
				this.mutateConfig((draft) => {
					draft.isPlayingWhenReady = true
				})
			}

			// TODO(teawithsand): here support for the rest of events
		})

		this.innerPlayerConfigBus.addSubscriber((config) => {
			this.innerPlayerStateBus.emitEvent(
				produce(this.innerPlayerStateBus.lastEvent, (draft) => {
					draft.config = config
				})
			)
		})

		this.player.stateBus.addSubscriber((state) => {
			this.mediaSessionManager.setPositionState({
				duration: state.duration,
				playbackRate: state.config.speed || 1, // TODO(teawithsand): debug why during init it can be zero
				position: state.position ?? 0,
			})

			this.mediaSessionManager.setPlaybackState(
				state.config.currentSourceKey === null
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

		const syncConfigToPlayer = (config: PlayerManagerConfig) => {
			this.player.mutateConfig((draft) => {
				draft.isPlayingWhenReady = config.isPlayingWhenReady
				draft.speed = config.speed
				draft.volume = config.userVolume
				draft.preservePitchForSpeed = config.preservePitchForSpeed
			})
		}

		this.innerPlayerConfigBus.addSubscriber((config) => {
			syncConfigToPlayer(config)
		})
		syncConfigToPlayer(this.innerPlayerConfigBus.lastEvent)

		this.player.stateBus.addSubscriber((state) => {
			const element = (this.player as any).element
			element.muted = false
			element.volume = 1
			console.log(element)

			const { playerError, sourceError } = state
			if (playerError || sourceError)
				console.error("player errors", { playerError, sourceError })
			console.log("state", state)
		})
	}

	setSources = (sources: PlayableEntry[]) => {
		this.player.setSourceProvider(emptySourceProvider)

		if (sources.length === 0) {
		} else {
			const src = new MapPlayerSourceProvider(sources, (s) => s.id)
			this.player.setSourceProvider(src)
			this.player.mutateConfig((draft) => {
				draft.currentSourceKey = src.getNextSourceKey(null) // get first key
			})
		}
	}

	setConfig = (options: PlayerManagerConfig) => {
		this.innerPlayerConfigBus.emitEvent(options)
	}

	mutateConfig = (mutator: (draft: Draft<PlayerManagerConfig>) => void) => {
		this.innerPlayerConfigBus.emitEvent(
			produce(this.innerPlayerConfigBus.lastEvent, (draft) =>
				mutator(draft)
			)
		)
	}
}

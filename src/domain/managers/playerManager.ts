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
			isPlayingWhenReady: false,
			preservePitchForSpeed: false,
			speed: 1,
			userVolume: 1,
		})

	public get playerConfigBus(): StickySubscribable<PlayerManagerConfig> {
		return this.innerPlayerConfigBus
	}

	private readonly mediaSessionManager = MediaSessionApiHelper.instance
	private readonly player = new Player<PlayableEntry, string>(
		new MapPlayerSourceProvider<PlayableEntry>([], (s) => s.id),
		new PlayableEntryPlayerSourceResolver(this.db)
	)

	private readonly innerPlayerStateBus =
		new DefaultStickyEventBus<PlayerManagerState>({
			config: this.innerPlayerConfigBus.lastEvent,
			innerState: this.player.stateBus.lastEvent,
			sources: [],
		})

	public get playerStateBus(): StickySubscribable<PlayerManagerState> {
		return this.innerPlayerStateBus
	}

	constructor(private readonly db: AbookDb) {
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
				playbackRate: state.config.speed,
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

		this.innerPlayerConfigBus.addSubscriber((config) => {
			this.player.mutateConfig((draft) => {
				draft.isPlayingWhenReady = config.isPlayingWhenReady
				draft.speed = config.speed
				draft.volume = config.userVolume
				draft.preservePitchForSpeed = config.preservePitchForSpeed
			})
		})
	}

	setSources = (sources: PlayableEntry[]) => {
		if (sources.length === 0) {
			this.player.setSourceProvider(emptySourceProvider)
			this.player.mutateConfig((draft) => {
				draft.currentSourceKey = null
			})
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

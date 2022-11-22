import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { ConfigManager } from "@app/domain/managers/config"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
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
	MediaSessionApiHelper,
	StickyEventBus,
	StickySubscribable,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export type PlayerManagerState = {
	innerState: PlayerState<PlayableEntry, string>
	sources: PlayableEntry[]

	// TODO(teawithsand): add more entries here
}

export class PlayerManager {
	private readonly mediaSessionManager = MediaSessionApiHelper.instance
	private readonly player: Player<PlayableEntry, string>

	private readonly innerPlayerStateBus: StickyEventBus<PlayerManagerState>

	public get playerStateBus(): StickySubscribable<PlayerManagerState> {
		return this.innerPlayerStateBus
	}

	constructor(db: AbookDb, configManager: ConfigManager) {
		this.player = new Player<PlayableEntry, string>(
			new PlayableEntryPlayerSourceResolver(db)
		)
		this.innerPlayerStateBus =
			new DefaultStickyEventBus<PlayerManagerState>({
				innerState: this.player.stateBus.lastEvent,
				sources: [],
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

	setSources = (sources: PlayableEntry[]) => {
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
		this.player.mutateConfig((draft) => {
			draft.sourceProvider = src
			draft.sourceKey = draft.sourceProvider.getNextSourceKey(null)
		})
	}

	mutateConfig = (
		mutator: (draft: Draft<PlayerConfig<PlayableEntry, string>>) => void
	) => {
		this.player.mutateConfig(mutator)
	}
}

import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { AbookDb } from "@app/domain/storage/db"
import {
	MapPlayerSourceProvider,
	Player,
	PlayerConfig,
	PlayerConfigFileEndHandlingMode,
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

	constructor(db: AbookDb) {
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
			draft.speed = 1.35
			draft.sourceKey = null
			draft.isPlayingWhenReady = false
		})
	}

	setSources = (sources: PlayableEntry[]) => {
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

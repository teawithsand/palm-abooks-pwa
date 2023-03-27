import { PlayerEntryListMetadataType } from "@app/domain/managers/newPlayer/list/metadata"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import { IntervalHelper } from "@app/util/IntervalHelper"
import { MediaSessionApiHelper } from "@teawithsand/tws-stl"

const ActionsToActivate: MediaSessionAction[] = [
	"play",
	"pause",
	"previoustrack",
	"nexttrack",
	"seekforward",
	"seekbackward",
]

export class MediaSessionManager {
	private intervalHelper = new IntervalHelper(10000)
	constructor(playerManager: NewPlayerManager) {
		MediaSessionApiHelper.instance.setActiveActions(ActionsToActivate)
		const results = MediaSessionApiHelper.instance.getActivationResults()
		if ([...Object.values(results)].some((e) => e !== null)) {
			console.warn(
				"Filed to activate some media session event handlers",
				results
			)
		}

		this.intervalHelper.bus.addSubscriber(() => {
			MediaSessionApiHelper.instance.setActiveActions([])
			MediaSessionApiHelper.instance.setActiveActions(ActionsToActivate)
			MediaSessionApiHelper.instance.clearPlaybackStateCache()
			MediaSessionApiHelper.instance.clearMetadataCache()
		})

		playerManager.bus.addSubscriber((state) => {
			const isNoneState =
				state.playerEntryListManagerState.listState.entriesBag.isEmpty
			MediaSessionApiHelper.instance.setPlaybackState(
				isNoneState
					? "none"
					: state.playerState.config.isPlayingWhenReady
					? "playing"
					: "paused"
			)
			
			MediaSessionApiHelper.instance.setPositionState({
				duration: state.playerState.duration !== null ? state.playerState.duration / 1000 : 0,
				position: (state.playerState.position ?? 0) / 1000,
				playbackRate: state.playerState.config.speed,
			})

			const metadata = state.playerEntryListManagerState.listMetadata

			if (metadata.data.type === PlayerEntryListMetadataType.ABOOK) {
				const abook = metadata.data.abook
				MediaSessionApiHelper.instance.setMetadata({
					title: abook.title,
					album: "",
					artist: abook.authorName ?? "",
					artwork: [], // TODO(teawithsand): artwork support here
				})
			} else if (
				metadata.data.type === PlayerEntryListMetadataType.LOCAL_FILES
			) {
				const currentEntry = state.playerEntryListManagerState
					.currentEntryId
					? state.playerEntryListManagerState.states.full.entriesBag.findById(
							state.playerEntryListManagerState.currentEntryId
					  )
					: null

				if (!currentEntry) {
					MediaSessionApiHelper.instance.setMetadata({
						title: "Playing files from local device",
						album: "",
						artist: "PalmABooks PWA",
						artwork: [],
					})
				} else {
					MediaSessionApiHelper.instance.setMetadata({
						title:
							currentEntry.successMetadata?.title ??
							currentEntry.displayName,
						album: currentEntry.successMetadata?.album ?? "",
						artist: currentEntry.successMetadata?.artist ?? "",
						artwork: [],
					})
				}
			} else {
				MediaSessionApiHelper.instance.setMetadata({
					title: "PalmABooks PWA",
					album: "",
					artist: "",
					artwork: [],
				})
			}
		})
	}
}

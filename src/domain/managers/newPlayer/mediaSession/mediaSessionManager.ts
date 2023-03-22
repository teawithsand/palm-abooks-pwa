import { PlayerEntryListMetadataType } from "@app/domain/managers/newPlayer/list/metadata"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import { MediaSessionApiHelper } from "@teawithsand/tws-stl"

export class MediaSessionManager {
	constructor(playerManager: NewPlayerManager) {
		// note: button actions right now are handled in playerActionsManager. this is to-be-refactored

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
				duration: state.playerState.duration,
				position: state.playerState.position ?? 0,
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

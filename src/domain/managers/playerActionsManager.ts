import { PlayerManager } from "@app/domain/managers/playerManager"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
import { isTimeNumber } from "@teawithsand/tws-player"
import {
	formatDurationSeconds,
	MediaSessionApiHelper,
	MediaSessionEventType,
	throwExpression,
} from "@teawithsand/tws-stl"

// TODO(teawithsand): hook jump back after pause manager to this class' play/pause method.
// TODO(teawithsand): hook this manager everywhere player's needed

// TODO(teawithsand): put position loading somewhere, so that player UI is disabled BEFORE position load happens

export class PlayerActionManager {
	constructor(
		private readonly playerManager: PlayerManager,
		private readonly whatToPlayManager: WhatToPlayManager
	) {
		this.initMediaSession()
	}

	private mediaSessionManager = MediaSessionApiHelper.instance
	private initMediaSession = () => {
		this.mediaSessionManager.setSupportedActions([
			"play",
			"pause",
			"nexttrack",
			"previoustrack",
		])
		this.mediaSessionManager.eventBus.addSubscriber((event) => {
			if (event.type === MediaSessionEventType.PAUSE) {
				this.setIsPlaying(false)
			} else if (event.type === MediaSessionEventType.PLAY) {
				this.setIsPlaying(true)
			} else if (event.type === MediaSessionEventType.PREVIOUS_TRACK) {
				this.prevFile()
			} else if (event.type === MediaSessionEventType.NEXT_TRACK) {
				this.nextFile()
			}

			// TODO(teawithsand): here support for the rest of events
		})
	}

	public localSeek = (posMillis: number) => {
		if (!isTimeNumber(posMillis)) return

		this.playerManager.mutateConfig((draft) => {
			draft.seekPosition = posMillis
		})
	}
	public localRelativeSeek = (deltaMillis: number) => {
		if (isFinite(deltaMillis)) return

		const currentPosition =
			this.playerManager.playerStateBus.lastEvent.innerState.position
		if (currentPosition === null) return

		this.localSeek(Math.max(0, currentPosition + deltaMillis))
	}

	public globalSeek = (posMillis: number) => {
		if (!isTimeNumber(posMillis)) return

		const { metadata, entriesBag } =
			this.whatToPlayManager.bus.lastEvent ?? {}
		if (!metadata || !entriesBag) return

		const index = metadata.getIndexFromPosition(posMillis)
		if (index === null) return

		const subtractOffset =
			metadata.getDurationToIndex(index) ??
			throwExpression(
				new Error(
					`If index was found, then duration to index must be found as well`
				)
			)

		const entryId = entriesBag.findByIndex(index)?.id ?? null

		if (entryId === null) return null

		this.playerManager.mutateConfig((draft) => {
			draft.sourceKey = entryId
			draft.seekPosition = posMillis - subtractOffset
		})
	}

	public globalRelativeSeek = (deltaMillis: number) => {
		if (isFinite(deltaMillis)) return

		const sourceKey =
			this.playerManager.playerStateBus.lastEvent.innerState.config
				.sourceKey
		const currentPosition =
			this.playerManager.playerStateBus.lastEvent.innerState.position
		if (sourceKey === null || currentPosition === null) return

		const { metadata, entriesBag } =
			this.whatToPlayManager.bus.lastEvent ?? {}
		if (!metadata || !entriesBag) return

		const entryIndex = entriesBag.findIndexById(sourceKey)
		if (entryIndex === null) return

		const durationToIndex = metadata.getDurationToIndex(entryIndex)
		if (durationToIndex === null) return

		this.globalSeek(
			Math.max(0, currentPosition + durationToIndex + deltaMillis)
		)
	}

	public jump = (entryId: string, posMillis = 0) => {
		this.playerManager.mutateConfig((draft) => {
			draft.sourceKey = entryId
			draft.seekPosition = posMillis || null
		})
	}

	public nextFile = () => {
		const provider =
			this.playerManager.playerStateBus.lastEvent.innerState.config
				.sourceProvider

		this.playerManager.mutateConfig((draft) => {
			draft.sourceKey = provider.getNextSourceKey(draft.sourceKey)
			draft.seekPosition = null
		})
	}

	public jumpForward = () => {
		// TODO(teawithsand): NIY
	}
	public jumpBackward = () => {
		// TODO(teawithsand): NIY
	}

	public prevFile = () => {
		const provider =
			this.playerManager.playerStateBus.lastEvent.innerState.config
				.sourceProvider

		this.playerManager.mutateConfig((draft) => {
			draft.sourceKey = provider.getPrevSourceKey(draft.sourceKey)
			draft.seekPosition = null
		})
	}

	public togglePlay = () => {
		this.playerManager.mutateConfig((draft) => {
			draft.isPlayingWhenReady = !draft.isPlayingWhenReady
		})
	}

	public setIsPlaying = (isPlaying: boolean) => {
		this.playerManager.mutateConfig((draft) => {
			draft.isPlayingWhenReady = isPlaying
		})
	}

	public setSpeed = (speed: number) => {
		// TODO(teawithsand): NIY
	}

	public setSleep = (sleepData: null) => {
		// TODO(teawithsand): NIY
	}
}
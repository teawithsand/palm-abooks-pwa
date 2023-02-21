import { SeekBackStrategyEntity } from "@app/domain/defines/player/seekBack/strategy"
import { SeekDiscardCondition, SeekType } from "@app/domain/defines/seek"
import { ConfigManager } from "@app/domain/managers/config"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import {
	PerformanceTimestampMs,
	generateUUID,
	getNowPerformanceTimestamp,
} from "@teawithsand/tws-stl"

export class SeekBackManager {
	private seekBackStrategy: SeekBackStrategyEntity | null = null

	private currentMetadataId: string | null = null
	private lastPauseTimestamp: PerformanceTimestampMs | null = null
	private currentIsPlaying = false

	private onPause = () => {
		this.lastPauseTimestamp = getNowPerformanceTimestamp()
	}

	private onPlay = () => {
		this.lastPauseTimestamp = null
	}

	onBeforeToggledToPlay = () => {
		if (this.lastPauseTimestamp === null) return

		const pauseDuration = Math.max(
			0,
			getNowPerformanceTimestamp() - this.lastPauseTimestamp
		)
		if (this.seekBackStrategy) {
			const time =
				this.seekBackStrategy.computeJumpBackTime(pauseDuration)
			return this.playerManager.seekQueue.enqueueSeek({
				id: generateUUID(),
				discardCond: SeekDiscardCondition.NEVER,
				seekData: {
					type: SeekType.RELATIVE_GLOBAL,
					positionDeltaMs: -time,
				},
				deadlinePerfTimestamp: (getNowPerformanceTimestamp() +
					300) as PerformanceTimestampMs,
			})
		}

		return null
	}

	constructor(
		configManger: ConfigManager,
		private readonly playerManager: NewPlayerManager
	) {
		configManger.globalPlayerConfig.bus.addSubscriber((config) => {
			const data = config?.seekBackStrategy ?? null
			this.seekBackStrategy = data
				? SeekBackStrategyEntity.Serializer.deserialize(data)
				: null
		})
		playerManager.bus.addSubscriber((state) => {
			const metadataId = state.playerEntryListManagerState.listMetadata.id
			const isPlaying = state.playerState.config.isPlayingWhenReady
			if (metadataId !== this.currentMetadataId) {
				this.currentMetadataId = metadataId

				this.lastPauseTimestamp = null
				this.currentIsPlaying = isPlaying
			}

			if (isPlaying !== this.currentIsPlaying) {
				this.currentIsPlaying = isPlaying
				if (isPlaying) {
					this.onPlay()
				} else {
					this.onPause()
				}
			}
		})
	}
}

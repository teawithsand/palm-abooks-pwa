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
	private waitUntilPlay = false
    
	constructor(configManger: ConfigManager, playerManager: NewPlayerManager) {
		configManger.globalPlayerConfig.bus.addSubscriber((config) => {
			const data = config?.seekBackStrategy ?? null
			this.seekBackStrategy = data
				? SeekBackStrategyEntity.Serializer.deserialize(data)
				: null
		})
		playerManager.bus.addSubscriber((state) => {
			const metadataId = state.playerEntryListManagerState.listMetadata.id
			if (metadataId !== this.currentMetadataId) {
				this.currentMetadataId = metadataId

				this.lastPauseTimestamp = null
				this.waitUntilPlay = true
			}

			const isPlaying = state.playerState.config.isPlayingWhenReady
			if (this.waitUntilPlay && isPlaying) {
				this.waitUntilPlay = false
			}

			if (!this.waitUntilPlay && !isPlaying) {
				if (this.lastPauseTimestamp !== null) {
					const pauseDuration = Math.max(
						0,
						getNowPerformanceTimestamp() - this.lastPauseTimestamp
					)
					if (this.seekBackStrategy) {
						const time =
							this.seekBackStrategy.computeJumpBackTime(
								pauseDuration
							)
						playerManager.seekQueue.enqueueSeek({
							id: generateUUID(),
							discardCond: SeekDiscardCondition.NEVER,
							seekData: {
								type: SeekType.RELATIVE_GLOBAL,
								positionDeltaMs: -time,
							},
							deadlinePerfTimestamp:
								(getNowPerformanceTimestamp() +
									300) as PerformanceTimestampMs,
						})
					}
				}
				this.lastPauseTimestamp = getNowPerformanceTimestamp()
			}
		})
	}
}

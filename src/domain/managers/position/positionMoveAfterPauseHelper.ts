import { PlayerManager } from "@app/domain/managers/player/playerManager"
import { getNowTimestamp, TimestampMs } from "@teawithsand/tws-stl"

export class PositionMoveAfterPauseManager {
	private innerIsPlaying = false
	private currentWhatToPlayDataId: string | null = null
	private lastPauseTimestamp: TimestampMs | null = null

	constructor(playerManager: PlayerManager) {
		playerManager.playerStateBus.addSubscriber((state) => {
			const dataId = state.whatToPlayData?.id ?? null
			if (dataId !== this.currentWhatToPlayDataId) {
				// reset pause timestamp each time WTP data changes
				this.lastPauseTimestamp = null
			}

			if (
				!this.innerIsPlaying &&
				!state.innerState.config.isPlayingWhenReady
			) {
				this.onPause()
			}
		})
	}

	private onPause = () => {
		this.lastPauseTimestamp = getNowTimestamp()
	}

	computeJumpBackTime = (): number => {
		return 0
	}
}

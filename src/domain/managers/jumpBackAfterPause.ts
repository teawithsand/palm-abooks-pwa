import { PlayerManager } from "@app/domain/managers/playerManager"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
import { getNowTimestamp, TimestampMs } from "@teawithsand/tws-stl"

export class JumpBackAfterPauseManager {
	private innerIsPlaying = false
	private currentWhatToPlayDataId: string | null = null
	private lastPauseTimestamp: TimestampMs | null = null

	constructor(
		whatToPlayManager: WhatToPlayManager,
		playerManager: PlayerManager
	) {
		whatToPlayManager.bus.addSubscriber((data) => {
			const dataId = data?.id ?? null
			if (dataId !== this.currentWhatToPlayDataId) {
				// reset pause timestamp each time WTP data changes
				this.lastPauseTimestamp = null
			}
		})

		playerManager.playerStateBus.addSubscriber((state) => {
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

	computeJumpBackTimeForPastPlayed = (
		lastEndOfPlayingTimestamp: TimestampMs | null
	): number => {
		if (lastEndOfPlayingTimestamp === null) return 0
		const now = getNowTimestamp()
		const delta = now - lastEndOfPlayingTimestamp
		if (delta <= 0) return 0

		// 1 second of jump back for 3 seconds of not playing, simple linear fn
		const jumpTime = delta * 0.3

		// limit jumping back to 30 seconds
		return Math.min(30 * 1000, jumpTime)
	}

	computeJumpBackTime = (): number => {
		return this.computeJumpBackTimeForPastPlayed(this.lastPauseTimestamp)
	}
}

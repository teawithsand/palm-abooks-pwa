import { SeekDiscardCondition, SeekType } from "@app/domain/defines/seek"
import {
	PlayerManager,
	PositionLoadingState,
} from "@app/domain/managers/player/playerManager"
import { SeekEvent } from "@app/domain/managers/player/seekQueue"
import {
	DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY,
	PositionMoveAfterPauseStrategy,
	computeJumpBackTimeAfterPauseDuration,
} from "@app/domain/managers/position/positionMoveAfterPauseStrategy"
import {
	PerformanceTimestampMs,
	StickySubscribable,
	generateUUID,
	getNowPerformanceTimestamp
} from "@teawithsand/tws-stl"

export class PositionMoveAfterPauseManager {
	private innerIsPlaying = false
	private currentWhatToPlayDataId: string | null = null
	private lastPauseTimestamp: PerformanceTimestampMs | null = null

	private strategy: PositionMoveAfterPauseStrategy =
		DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY

	constructor(private readonly playerManager: PlayerManager) {
		playerManager.playerStateBus.addSubscriber((state) => {
			if (
				state.innerState.config.sourceKey === null ||
				!state.innerState.config.sourceProvider
			) {
				return
			}

			if (
				![
					PositionLoadingState.NOT_FOUND,
					PositionLoadingState.ERROR,
					PositionLoadingState.LOADED,
				].includes(state.positionLoadingState)
			) {
				return
			}

			const isPlaying = state.innerState.config.isPlayingWhenReady
			const dataId = state.whatToPlayData?.id ?? null

			if (dataId !== this.currentWhatToPlayDataId) {
				this.lastPauseTimestamp = null
				this.currentWhatToPlayDataId = dataId
				this.innerIsPlaying = isPlaying
			}

			if (this.innerIsPlaying !== isPlaying) {
				if (isPlaying) {
					this.onPlay()
				} else {
					this.onPause()
				}

				this.innerIsPlaying = isPlaying
			}
		})
	}

	private onPause = () => {
		this.lastPauseTimestamp = getNowPerformanceTimestamp()
	}

	private onPlay = () => {
		this.lastPauseTimestamp = null
	}

	computeJumpBackTime = (): number => {
		const now = getNowPerformanceTimestamp()
		if (this.lastPauseTimestamp === null) {
			return 0
		}

		return computeJumpBackTimeAfterPauseDuration(
			this.strategy,
			now - this.lastPauseTimestamp
		)
	}

	enqueueJumpBackSeek = (): StickySubscribable<SeekEvent | null> | null => {
		const deltaTime = Math.abs(this.computeJumpBackTime())
		if (deltaTime === 0) return null

		// HACK(teawithsand): reset inner jump back timer, so if two is playing changes occurr in short timespan, then
		// only one will cause jumping back
		this.lastPauseTimestamp = getNowPerformanceTimestamp()

		return this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			deadlinePerfTimestamp: (getNowPerformanceTimestamp() +
				500) as PerformanceTimestampMs,
			discardCond: SeekDiscardCondition.NO_METADATA, // if no metadata, then we won't load it fast enough anyway
			seekData: {
				type: SeekType.RELATIVE_GLOBAL,
				positionDeltaMs: -deltaTime,
			},
		})
	}
}

import { isTimeNumber } from "@teawithsand/tws-player"

export enum PositionMoveAfterPauseStrategyType {
	NONE = 0,
	LINEAR = 1,
}

export type PositionMoveAfterPauseStrategy =
	| {
			type: PositionMoveAfterPauseStrategyType.NONE
	  }
	| {
			type: PositionMoveAfterPauseStrategyType.LINEAR
			coefficient: number
			limit: number
	  }

export const DEFAULT_POSITION_MOVE_AFTER_PAUSE_STRATEGY: PositionMoveAfterPauseStrategy = {
	type: PositionMoveAfterPauseStrategyType.LINEAR,
	coefficient: 0.3,
	limit: 30 * 1000,
}

export const computeJumpBackTimeAfterPauseDuration = (
	strategy: PositionMoveAfterPauseStrategy,
	pauseDurationMillis: number
): number => {
	if (!isTimeNumber(pauseDurationMillis) || pauseDurationMillis < 0) return 0

	if (strategy.type === PositionMoveAfterPauseStrategyType.NONE) {
		return 0
	} else if (strategy.type === PositionMoveAfterPauseStrategyType.LINEAR) {
		return Math.max(
			0,
			Math.min(strategy.limit, strategy.coefficient * pauseDurationMillis)
		)
	} else {
		throw new Error("Unreachable code")
	}
}
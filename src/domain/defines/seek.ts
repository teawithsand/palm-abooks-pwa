import { PerformanceTimestampMs } from "@teawithsand/tws-stl"

export enum SeekType {
	ABSOLUTE_GLOBAL = 1,
	ABSOLUTE_IN_FILE = 2,
	ABSOLUTE_TO_FILE = 3,
	RELATIVE_GLOBAL = 4,
	RELATIVE_IN_FILE = 5,
}

export type SeekData =
	| {
			type: SeekType.ABSOLUTE_GLOBAL
			positionMs: number
	  }
	| {
			type: SeekType.ABSOLUTE_IN_FILE
			positionMs: number
	  }
	| ({
			type: SeekType.ABSOLUTE_TO_FILE
	  } & TrivialSeekData)
	| {
			type: SeekType.RELATIVE_GLOBAL
			positionDeltaMs: number
	  }
	| {
			type: SeekType.RELATIVE_IN_FILE
			positionDeltaMs: number
	  }

/**
 * SeekData, which can be directly supplied into player.
 */
export type TrivialSeekData = {
	positionMs: number
	playableEntryId: string
}

/**
 * When seek should be discarded from seek queue.
 */
export enum SeekDiscardCondition {
	/**
	 * Always wait until deadline for this seek, unless one is set.
	 */
	NEVER = 1,

	/**
	 * Discard this seek if can't seek right now(say, another seek is in queue), then just throw it away.
	 */
	INSTANT = 2, 

	/**
	 * Discard this seek if there is no metadata loaded, which for some reason is required to perform that seek.
	 * Otherwise(say, another seek is in queue) wait until it's possible to execute it or until deadline.
	 */
	NO_METADATA = 3, 
}

export type ExtendedSeekData = {
	id: string
	discardCond: SeekDiscardCondition
	deadlinePerfTimestamp: PerformanceTimestampMs | null
	seekData: SeekData
	/**
	 * Function, which is called *just* before this seek is executed and after it was popped from queue.
	 * If it returns false, then seek will be discarded due to condition failure.
	 */
	immediateExecCond?: (() => boolean) | null
}

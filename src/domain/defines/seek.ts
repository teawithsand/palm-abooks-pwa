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
	NEVER = 1, // Hold seek until it's possible to seek.
	INSTANT = 2, // If can't seek right now, just throw it
	NO_METADATA = 3, // If there is no metadata loaded, which for some reason is required to perform that seek
}

export type ExtendedSeekData = {
	id: string
	discardCond: SeekDiscardCondition
	deadlinePerfTimestamp: PerformanceTimestampMs | null
	seekData: SeekData
}

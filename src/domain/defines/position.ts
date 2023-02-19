import { TimestampMs } from "@teawithsand/tws-stl"

export enum PositionType {
	FILE_ENTITY_ID_AND_LOCAL_OFFSET = 1,
	FILE_NAME_AND_LOCAL_OFFSET = 2,
	GLOBAL_OFFSET = 3,
}

/**
 * Position in Abook playlist or anything else stored in time.
 */
export type Position =
	| {
			type: PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET
			fileEntityId: string
			positionMs: number
	  }
	| {
			type: PositionType.FILE_NAME_AND_LOCAL_OFFSET
			fileName: string
			positionMs: number
	  }
	| {
			type: PositionType.GLOBAL_OFFSET
			positionMs: number
	  }

/**
 * Position, which is stored in redundant manner, which allows persisting it across modifications of file list.
 */
export type PositionVariants = {
	[key in PositionType]?: Position & { type: key }
}

export type SavedPositionVariants = {
	variants: PositionVariants
	savedTimestamp: TimestampMs
}

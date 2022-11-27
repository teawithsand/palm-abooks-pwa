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
	| {
			type: SeekType.ABSOLUTE_TO_FILE
			positionMs: number
			playableEntryId: string
	  }
	| {
			type: SeekType.RELATIVE_GLOBAL
			positionDeltaMs: number
	  }
	| {
			type: SeekType.RELATIVE_IN_FILE
			positionDeltaMs: number
	  }

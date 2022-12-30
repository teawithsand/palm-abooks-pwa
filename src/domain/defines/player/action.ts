export enum PlayerSeekActionType {
	JUMP_FILE = 1,
	SEEK_RELATIVE = 2,
}

export type PlayerSeekAction =
	| {
			type: PlayerSeekActionType.SEEK_RELATIVE
			offsetMillis: number
	  }
	| {
			type: PlayerSeekActionType.JUMP_FILE
	  }

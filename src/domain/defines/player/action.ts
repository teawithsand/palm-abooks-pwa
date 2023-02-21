import { Serializer } from "@app/util/transform"

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

export enum StoredPlayerSeekActionType {
	JUMP_FILE = 1,
	SEEK_RELATIVE = 2,
}

export type StoredPlayerSeekAction =
	| {
			type: StoredPlayerSeekActionType.SEEK_RELATIVE
			offsetMillis: number
	  }
	| {
			type: StoredPlayerSeekActionType.JUMP_FILE
	  }

export const PlayerSeekActionSerializer: Serializer<
	PlayerSeekAction,
	StoredPlayerSeekAction
> = {
	serialize: (input) => {
		if (input.type === PlayerSeekActionType.JUMP_FILE) {
			return {
				type: StoredPlayerSeekActionType.JUMP_FILE,
			}
		} else if (input.type === PlayerSeekActionType.SEEK_RELATIVE) {
			return {
				type: StoredPlayerSeekActionType.SEEK_RELATIVE,
				offsetMillis: input.offsetMillis,
			}
		} else {
			throw new Error(`Unreachable code`)
		}
	},
	deserialize: (input) => {
		if (input.type === StoredPlayerSeekActionType.JUMP_FILE) {
			return {
				type: PlayerSeekActionType.JUMP_FILE,
			}
		} else if (input.type === StoredPlayerSeekActionType.SEEK_RELATIVE) {
			return {
				type: PlayerSeekActionType.SEEK_RELATIVE,
				offsetMillis: input.offsetMillis,
			}
		} else {
			throw new Error(`Unreachable code`)
		}
	},
}

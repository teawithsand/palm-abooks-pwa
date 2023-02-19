import { AbookId } from "@app/domain/defines/abook"

export enum LastPlayedSourceType {
	ABOOK_ID = 1,
}

export type LastPlayedSource = {
	type: LastPlayedSourceType.ABOOK_ID
	id: AbookId
}

export type PersistentGlobalPlayerState = {
	lastPlayed: LastPlayedSource | null
}

export const INIT_PERSISTENT_GLOBAL_PLAYER_STATE: PersistentGlobalPlayerState =
	{
		lastPlayed: null,
	}

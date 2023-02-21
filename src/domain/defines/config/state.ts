import { AbookId } from "@app/domain/defines/abook"
import { Serializer } from "@app/util/transform"
import { VersioningSerializer } from "@teawithsand/tws-config"

export enum LastPlayedSourceType {
	ABOOK_ID = 1,
}

export type LastPlayedSource = {
	type: LastPlayedSourceType.ABOOK_ID
	id: AbookId
}

export enum StoredLastPlayedSourceType {
	ABOOK_ID = 1,
}

export type StoredLastPlayedSource = {
	type: StoredLastPlayedSourceType.ABOOK_ID
	id: AbookId
}

export type PersistentGlobalPlayerState = {
	lastPlayed: LastPlayedSource | null
}

export type StoredPersistentGlobalPlayerState = {
	version: 0
	lastPlayed: StoredLastPlayedSource | null
}

export const LastPlayerSourceSerializer: Serializer<
	LastPlayedSource,
	StoredLastPlayedSource
> = {
	serialize: (data) => {
		if (data.type === LastPlayedSourceType.ABOOK_ID) {
			return {
				type: StoredLastPlayedSourceType.ABOOK_ID,
				id: data.id,
			}
		} else {
			throw new Error(`Unreachable code`)
		}
	},
	deserialize: (data) => {
		if (data.type === StoredLastPlayedSourceType.ABOOK_ID) {
			return {
				type: LastPlayedSourceType.ABOOK_ID,
				id: data.id,
			}
		} else {
			throw new Error(`Unreachable code`)
		}
	},
}

export const PersistentGlobalPlayerStateSerializer = new VersioningSerializer<
	PersistentGlobalPlayerState,
	StoredPersistentGlobalPlayerState
>(
	(data) => ({
		version: 0,
		lastPlayed: data.lastPlayed
			? LastPlayerSourceSerializer.serialize(data.lastPlayed)
			: null,
	}),
	{
		0: (data) => ({
			lastPlayed: data.lastPlayed
				? LastPlayerSourceSerializer.deserialize(data.lastPlayed)
				: null,
		}),
	},
	0
)

export const INIT_PERSISTENT_GLOBAL_PLAYER_STATE: PersistentGlobalPlayerState =
	{
		lastPlayed: null,
	}

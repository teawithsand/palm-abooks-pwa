import { AbookEntity } from "@app/domain/defines/entity/abook"

export enum PlayerEntryListMetadataType {
	ABOOK = 1,
	UNKNOWN = 2,
	LOCAL_FILES = 3,
}

/**
 * Metadata attached to any kind of list.
 */
export type PlayerEntryListMetadata =
	| {
			type: PlayerEntryListMetadataType.ABOOK
			abook: AbookEntity
	  }
	| {
			type: PlayerEntryListMetadataType.UNKNOWN
	  }
	| {
			type: PlayerEntryListMetadataType.LOCAL_FILES // files are not included here
	  }

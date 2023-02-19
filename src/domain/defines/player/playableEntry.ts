import { FileEntryEntity } from "@app/domain/defines/entity/fileEntry"

/**
 * @deprecated to be replaced with new entity model
 */
export enum PlayableEntryType {
	FILE_ENTRY = 1,
	ARBITRARY_BLOB = 2,
	ARBITRARY_URL = 3,
}

/**
 * @deprecated to be replaced with new entity model
 */
export type PlayableEntry = {
	id: string
} & (
	| {
			type: PlayableEntryType.FILE_ENTRY
			entry: FileEntryEntity
	  }
	| {
			type: PlayableEntryType.ARBITRARY_BLOB
			blob: Blob | File
	  }
	| {
			type: PlayableEntryType.ARBITRARY_URL
			url: string
	  }
)

import { MetadataLoadingResult } from "@teawithsand/tws-player"

export type FileEntryId = string

export enum FileEntryType {
	INTERNAL_FILE = 1,
	URL = 2,
}

export enum FileEntryDisposition {
	UNKNOWN = 0,
	MUSIC = 1,
	IMAGE = 2,
	DESCRIPTION = 3,
}

export type FileEntryMetadata = {
	name: string
	size: number // negative if not known
	mime: string // empty if not known

	disposition: FileEntryDisposition | null // used to override guessed disposition from mime

	musicMetadata: MetadataLoadingResult | null // unset for non-music ofc
}

export type FileEntryData =
	| {
			dataType: FileEntryType.INTERNAL_FILE
			internalFileId: string
	  }
	| {
			dataType: FileEntryType.URL
			url: string
	  }

export type FileEntry = {
	id: FileEntryId // Unique ID of this file entry, generally used for purposes of position storing
	metadata: FileEntryMetadata

	data: FileEntryData
}

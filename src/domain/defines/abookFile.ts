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
	/**
	 * File name or something like that. Does not have to be unique(although it should).
	 * Has to identify file for user.
	 */
	name: string
	size: number | null // null if not known
	mime: string | null // null or empty if not known

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

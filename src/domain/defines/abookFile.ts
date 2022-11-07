import { Metadata, MetadataLoadingResult } from "@teawithsand/tws-player"

export enum FileEntryType {
	INTERNAL_FILE = 1,
	URL = 2,
}

export enum AbookFileDisposition {
	NOT_LOADED = -1,
	UNKNOWN = 0,
	MUSIC = 1,
	IMAGE = 2,
	DESCRIPTION = 3,
}

export type CachedAbookFileData = {
	size: number | null
} & (
	| {
			disposition: AbookFileDisposition.UNKNOWN
	  }
	| {
			disposition: AbookFileDisposition.MUSIC
			metadata: MetadataLoadingResult | null
	  }
	| {
			disposition: AbookFileDisposition.NOT_LOADED
	  }
)

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
	name: string
	cachedData: CachedAbookFileData | null

	data: FileEntryData
}

export type AbookId = string

export enum AbookFileDisposition {
	UNKNOWN = 0,
	MUSIC = 1,
	IMAGE = 2,
	DESCRIPTION = 3,
}

export type CachedAbookFileData =
	| {
			disposition: AbookFileDisposition.UNKNOWN
	  }
	| {
			disposition: AbookFileDisposition.MUSIC
			// metadata: // TODO(teawithsand): add imported metadata type here
	  }

export interface AbookFile {
	name: string
	lfsFileId: string
	data: CachedAbookFileData | null
}

export interface Abook {
	id: AbookId
	name: string
	files: AbookFile[]
}

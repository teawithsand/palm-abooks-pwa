import { FileEntry } from "@app/domain/defines/abookFile"
import { Metadata } from "@teawithsand/tws-player"

export type AbookId = string

export interface AbookMetadata {
	title: string
	authorName: string
	publishedYear: number | null
}

export interface Abook {
	id: AbookId
	metadata: AbookMetadata

	position: AbookSavedPosition | null

	entries: FileEntry[]
}

export interface AbookSavedPosition {
	fileName: string
	fileOffset: number
}

import { FileEntry } from "@app/domain/defines/abookFile"

export type AbookId = string

export interface AbookMetadata {
	title: string // empty if not provided
	authorName: string // empty if not provided
	publishedYear: number // 0 if not provided, negative for BC years
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

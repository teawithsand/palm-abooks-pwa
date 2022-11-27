import { FileEntry } from "@app/domain/defines/abookFile"
import { PositionVariants } from "@app/domain/defines/position"
import { TimestampMs } from "@teawithsand/tws-stl"

export type AbookId = string

export interface AbookMetadata {
	title: string // empty if not provided
	authorName: string // empty if not provided
	description: string // empty if not provided; entered by user directly
	publishedYear: number // 0 if not provided, negative for BC years
	addedAt: TimestampMs
	lastPlayedAt: TimestampMs // defaults to 0
}

export interface Abook {
	id: AbookId
	metadata: AbookMetadata

	position: PositionVariants | null

	entries: FileEntry[]
}

import {
    FileEntryEntity,
    StoredFileEntryEntity,
} from "@app/domain/defines/entity/fileEntry"
import { SavedPositionVariants } from "@app/domain/defines/position"
import { isBlank } from "@app/util/blank"
import { Serializer } from "@app/util/transform"
import { TimestampMs } from "@teawithsand/tws-stl"

/**
 * Abook's data, which can be modified using draft.
 */
export interface AbookData {
	title: string // empty if not provided
	authorName: string // empty if not provided
	description: string // empty if not provided; entered by user directly
	publishedYear: number // 0 if not provided, negative for BC years
	addedAt: TimestampMs
	lastPlayedAt: TimestampMs // defaults to 0

	position: SavedPositionVariants | null
}

/**
 * Entity, that wraps abook with some domain logic.
 */
export class AbookEntity implements AbookData {
	public static readonly Serializer: Serializer<
		AbookEntity,
		StoredAbookEntity
	> = {
		serialize: (entity) => ({
			...entity.data,
			entries: entity.entries.map((v) => v.serialize()),
		}),
		deserialize: (stored) =>
			new AbookEntity(
				stored,
				stored.entries.map((v) =>
					FileEntryEntity.Serializer.deserialize(v)
				)
			),
	}

	constructor(
		private data: AbookData,
		public readonly entries: FileEntryEntity[]
	) {}

	serialize = () => AbookEntity.Serializer.serialize(this)

	get displayName() {
		if (isBlank(this.authorName)) {
			return this.title
		}

		return `${this.authorName} - ${this.title}`
	}

	get title(): string {
		return this.data.title
	}
	get authorName(): string {
		return this.data.authorName
	}
	get description(): string {
		return this.data.description
	}
	get publishedYear(): number {
		return this.data.publishedYear
	}
	get addedAt(): TimestampMs {
		return this.data.addedAt
	}
	get lastPlayedAt(): TimestampMs {
		return this.data.lastPlayedAt
	}
	get position(): SavedPositionVariants | null {
		return this.data.position
	}
}

export interface StoredAbookEntity {
	title: string // empty if not provided
	authorName: string // empty if not provided
	description: string // empty if not provided; entered by user directly
	publishedYear: number // 0 if not provided, negative for BC years
	addedAt: TimestampMs
	lastPlayedAt: TimestampMs // defaults to 0

	position: SavedPositionVariants | null
	entries: StoredFileEntryEntity[]
}

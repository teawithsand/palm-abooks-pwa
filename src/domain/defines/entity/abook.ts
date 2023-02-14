import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import {
	FileEntryEntity,
	StoredFileEntryEntity,
} from "@app/domain/defines/entity/fileEntry"
import { SavedPositionVariants } from "@app/domain/defines/position"
import { isBlank } from "@app/util/blank"
import { Serializer } from "@app/util/transform"
import { MetadataBag } from "@teawithsand/tws-player"
import { TimestampMs } from "@teawithsand/tws-stl"

export interface AbookEntityData {
	id: string
	title: string // empty if not provided
	authorName: string // empty if not provided
	description: string // empty if not provided; entered by user directly
	publishedYear: number // 0 if not provided, negative for BC years
	addedAt: TimestampMs
	lastPlayedAt: TimestampMs // defaults to 0

	position: SavedPositionVariants | null

	entries: FileEntryEntity[]
}

/**
 * Entity, that wraps abook with some domain logic.
 */
export class AbookEntity {
	public static readonly serializer: Serializer<
		AbookEntity,
		StoredAbookEntity
	> = {
		serialize: (entity) => ({
			...entity.data,
			entries: entity.entries.map((v) => v.serialize()),
		}),
		deserialize: (stored) =>
			new AbookEntity({
				...stored,
				entries: stored.entries.map((v) =>
					FileEntryEntity.serializer.deserialize(v)
				),
			}),
	}

	constructor(public readonly data: AbookEntityData) {}

	serialize = () => AbookEntity.serializer.serialize(this)

	get id(): string {
		return this.data.id
	}

	get entries(): FileEntryEntity[] {
		return this.data.entries
	}

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

	get musicEntries(): FileEntryEntity[] {
		return this.entries.filter(
			(e) => e.dispositionOrGuess === FileEntryDisposition.MUSIC
		)
	}

	get metadataBag(): MetadataBag {
		return new MetadataBag(
			this.musicEntries.map((v) => v.musicMetadataLoadingResult)
		)
	}

	get duration(): number | null {
		return this.metadataBag.getDurationToIndex(
			this.entries.length - 1,
			true
		)
	}

	get coverImageEntry(): FileEntryEntity | null {
		return (
			this.entries.find(
				(e) => e.disposition === FileEntryDisposition.IMAGE
			) ??
			this.entries.find(
				(e) => e.dispositionOrGuess === FileEntryDisposition.IMAGE
			) ??
			null
		)
	}
}

export interface StoredAbookEntity {
	id: string
	title: string // empty if not provided
	authorName: string // empty if not provided
	description: string // empty if not provided; entered by user directly
	publishedYear: number // 0 if not provided, negative for BC years
	addedAt: TimestampMs
	lastPlayedAt: TimestampMs // defaults to 0

	position: SavedPositionVariants | null
	entries: StoredFileEntryEntity[]
}

import {
	FileEntryType as FileEntryContentType,
	FileEntryDisposition,
} from "@app/domain/defines/abookFile"
import { InternalFilePlayerSource } from "@app/domain/managers/player/source/internalFile"
import { guessDisposition } from "@app/domain/storage/disposition"
import { Serializer } from "@app/util/transform"
import {
	Metadata,
	MetadataLoadingResult,
	MetadataLoadingResultType,
	PlayerSource,
} from "@teawithsand/tws-player"

export type FileEntryEntityData = {
	id: string

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

export type FileEntryEntityContent =
	| {
			dataType: FileEntryContentType.INTERNAL_FILE
			internalFileId: string
	  }
	| {
			dataType: FileEntryContentType.URL
			url: string
	  }

export interface StoredFileEntryEntity {
	id: string
	name: string
	size: number | null // null if not known
	mime: string | null // null or empty if not known

	disposition: FileEntryDisposition | null // used to override guessed disposition from mime

	musicMetadata: MetadataLoadingResult | null // unset for non-music ofc
	fileData: FileEntryEntityContent
}

export class FileEntryEntity {
	public static readonly serializer: Serializer<
		FileEntryEntity,
		StoredFileEntryEntity
	> = {
		deserialize: (input) =>
			new FileEntryEntity(
				{
					disposition: input.disposition,
					mime: input.mime,
					musicMetadata: input.musicMetadata,
					name: input.name,
					size: input.size,
					id: input.id,
				},
				input.fileData
			),
		serialize: (input) => ({
			...input.data,
			fileData: input.content,
		}),
	}

	constructor(
		public readonly data: FileEntryEntityData,
		public readonly content: FileEntryEntityContent
	) {}

	serialize = () => FileEntryEntity.serializer.serialize(this)

	get id(): string {
		return this.data.id
	}

	get size(): number | null {
		return this.data.size
	}

	get name(): string {
		return this.data.name
	}

	get disposition(): FileEntryDisposition | null {
		return this.data.disposition
	}

	get mime(): string | null {
		return this.data.mime
	}

	get dispositionOrGuess(): FileEntryDisposition {
		if (this.content.dataType === FileEntryContentType.URL) {
			return (
				this.disposition ??
				guessDisposition({
					url: this.content.url,
				})
			)
		} else {
			return (
				this.disposition ??
				guessDisposition({
					mime: this.mime ?? "",
					name: this.name,
				})
			)
		}
	}

	get musicMetadataLoadingResult() {
		return this.data.musicMetadata
	}

	get musicMetadata(): Metadata | null {
		const res = this.data.musicMetadata
		if (!res) return null
		if (res.type !== MetadataLoadingResultType.OK) return null

		return res.metadata
	}
}

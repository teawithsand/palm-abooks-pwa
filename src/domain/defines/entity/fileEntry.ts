import {
	FileEntryType as FileEntryContentType,
	FileEntryDisposition,
} from "@app/domain/defines/abookFile"
import { guessDisposition } from "@app/domain/storage/disposition"
import { Serializer } from "@app/util/transform"
import { MetadataLoadingResult } from "@teawithsand/tws-player"

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

export type FileEntryContent =
	| {
			dataType: FileEntryContentType.INTERNAL_FILE
			internalFileId: string
	  }
	| {
			dataType: FileEntryContentType.URL
			url: string
	  }

export interface StoredFileEntryEntity {
	name: string
	size: number | null // null if not known
	mime: string | null // null or empty if not known

	disposition: FileEntryDisposition | null // used to override guessed disposition from mime

	musicMetadata: MetadataLoadingResult | null // unset for non-music ofc
	fileData: FileEntryContent
}

export class FileEntryEntity {
	public static readonly Serializer: Serializer<
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
				},
				input.fileData
			),
		serialize: (input) => ({
			...input.metadata,
			fileData: input.content,
		}),
	}

	constructor(
		private metadata: FileEntryMetadata,
		public readonly content: FileEntryContent
	) {}

	serialize = () => FileEntryEntity.Serializer.serialize(this)

	get size(): number | null {
		return this.metadata.size
	}

	get name(): string {
		return this.metadata.name
	}

	get disposition(): FileEntryDisposition | null {
		return this.metadata.disposition
	}

	get mime(): string | null {
		return this.metadata.mime
	}

	get dispositionOrGuess(): FileEntryDisposition {
		return (
			this.disposition ??
			guessDisposition({
				mime: this.mime ?? "",
				name: this.name,
			})
		)
	}
}

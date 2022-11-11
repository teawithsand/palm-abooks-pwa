import { FileEntry, FileEntryType } from "@app/domain/defines/abookFile"
import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import { AbookDb } from "@app/domain/storage/db"
import {
	BasePlayerSourceResolver,
	BasePlayerSourceResolverExtractedData,
	SourcePlayerError,
} from "@teawithsand/tws-player"
import { generateUUID, throwExpression } from "@teawithsand/tws-stl"

export class FilePlayerSourceResolver extends BasePlayerSourceResolver<
	Blob | File
> {
	protected extractData(
		source: Blob | File
	): BasePlayerSourceResolverExtractedData {
		return {
			type: "blob",
			blob: source,
			id: generateUUID(), // just assume everything we get is unique
		}
	}
}

export class FileEntryPlayerSourceResolver extends BasePlayerSourceResolver<FileEntry> {
	constructor(public readonly database: AbookDb) {
		super()
	}

	protected extractData(
		source: FileEntry
	): BasePlayerSourceResolverExtractedData {
		const { data } = source
		if (data.dataType === FileEntryType.INTERNAL_FILE) {
			return {
				id: source.id,
				type: "blob-loader",
				loader: async () => {
					return (
						(await this.database.getInternalFileBlob(
							data.internalFileId
						)) ??
						throwExpression(
							new Error(
								`Cant't resolve internal file entry with id ${data.internalFileId}`
							)
						)
					)
				},
			}
		} else if (data.dataType === FileEntryType.URL) {
			return {
				type: "url",
				id: source.id,
				url: data.url,
			}
		} else {
			throw new Error(`Unknown data type ${(data as any).dataType}`)
		}
	}
}

export class PlayableEntryPlayerSourceResolver extends BasePlayerSourceResolver<PlayableEntry> {
	constructor(private readonly database: AbookDb) {
		super()
	}

	protected extractData(
		source: PlayableEntry
	): BasePlayerSourceResolverExtractedData {
		if (source.type === PlayableEntryType.FILE_ENTRY) {
			const { data } = source.entry
			if (data.dataType === FileEntryType.INTERNAL_FILE) {
				return {
					id: source.id,
					type: "blob-loader",
					loader: async () => {
						return (
							(await this.database.getInternalFileBlob(
								data.internalFileId
							)) ??
							throwExpression(
								new Error(
									`Cant't resolve internal file entry with id ${data.internalFileId}`
								)
							)
						)
					},
				}
			} else if (data.dataType === FileEntryType.URL) {
				return {
					type: "url",
					id: source.id,
					url: data.url,
				}
			} else {
				throw new Error(`Unknown data type ${(data as any).dataType}`)
			}
		} else if (source.type === PlayableEntryType.ARBITRARY_URL) {
			return {
				type: "url",
				id: source.id,
				url: source.url,
			}
		} else if (source.type === PlayableEntryType.ARBITRARY_BLOB) {
			return {
				type: "blob",
				id: source.id,
				blob: source.blob,
			}
		} else {
			const any = source as any
			throw new SourcePlayerError(
				`PlayableEntry with id ${any.id} has invalid type ${any.type}`
			)
		}
	}
}

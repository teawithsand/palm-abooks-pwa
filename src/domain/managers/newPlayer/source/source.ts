import { FileEntryType } from "@app/domain/defines/abookFile"
import { FileEntryEntity } from "@app/domain/defines/entity/fileEntry"
import { AbookDb } from "@app/domain/storage/db"
import {
	LoaderPlayerSource,
	LoaderPlayerSourceLoadable,
} from "@teawithsand/tws-player"
import { throwExpression } from "@teawithsand/tws-stl"

/**
 * PlayerSource, which loads file fom AbooksDB internal file.
 */
export class InternalFilePlayerSource extends LoaderPlayerSource {
	constructor(
		private readonly db: AbookDb,
		public readonly internalFileId: string
	) {
		super()
	}

	load = async () => {
		return (
			(await this.db.getInternalFileBlob(this.internalFileId)) ??
			throwExpression(
				new Error(
					`Cant't resolve internal file entry with id ${this.internalFileId}`
				)
			)
		)
	}
}

export class FileEntryEntityPlayerSource extends LoaderPlayerSource {
	constructor(
		private readonly db: AbookDb,
		public readonly entry: FileEntryEntity
	) {
		super()
	}

	load = async (): Promise<LoaderPlayerSourceLoadable> => {
		const { content } = this.entry
		if (content.dataType === FileEntryType.INTERNAL_FILE) {
			return (
				(await this.db.getInternalFileBlob(content.internalFileId)) ??
				throwExpression(
					new Error(
						`Cant't resolve internal file entry with id ${content.internalFileId}`
					)
				)
			)
		} else if (content.dataType === FileEntryType.URL) {
			return content.url
		} else {
			throw new Error("Unreachable code")
		}
	}
}

import { AbookEntity } from "@app/domain/defines/entity/abook"
import { FileEntryEntity } from "@app/domain/defines/entity/fileEntry"
import { useAppManager } from "@app/domain/managers/app"
import { loadBlobMetadataUtil } from "@app/util/metadataLoadingResult"
import { zip } from "@app/util/zip"
import { useMutation } from "@tanstack/react-query"
import { MetadataLoadingResult } from "@teawithsand/tws-player"
import produce from "immer"

export interface AbookAddFilesMutationArgs {
	files: File[]
	abook: AbookEntity
}

export const useMutationAbookAddFiles = () => {
	const app = useAppManager()
	return useMutation(async (args: AbookAddFilesMutationArgs) => {
		const { abook, files } = args

		const metadataList: MetadataLoadingResult[] = []
		for (const file of files) {
			const result = await loadBlobMetadataUtil(file)
			metadataList.push(result)
		}

		const abookAccess = await app.abookDb.abookWriteAccess(abook.id)
		try {
			for (const [file, metadata] of zip(files, metadataList)) {
				if (file.size === 0) return

				await abookAccess.addInternalFileExt(
					file.name,
					file,
					(draft, entry) => {
						draft.entries.push(
							new FileEntryEntity(
								produce(entry.data, (draft) => {
									draft.musicMetadata = metadata
								}),
								entry.content
							)
						)
					}
				)
			}
		} finally {
			abookAccess.release()
		}
	})
}

import { AbookEntity } from "@app/domain/defines/entity/abook"
import { FileEntryEntity } from "@app/domain/defines/entity/fileEntry"
import { FileTransferEntry } from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { loadBlobMetadataUtil } from "@app/util/metadataLoadingResult"
import { zip } from "@app/util/zip"
import { useMutation } from "@tanstack/react-query"
import { MetadataLoadingResult } from "@teawithsand/tws-player"
import produce from "immer"

export interface AbookAddFileTransferEntityMutationArgs {
	transferEntries: FileTransferEntry[]
	abook: AbookEntity
}

export const useMutationAbookAddFileTransferEntity = () => {
	const app = useAppManager()
	return useMutation(async (args: AbookAddFileTransferEntityMutationArgs) => {
		const { abook, transferEntries } = args

		const metadataList: MetadataLoadingResult[] = []
		for (const transferEntry of transferEntries) {
			const result = await loadBlobMetadataUtil(transferEntry.file)
			metadataList.push(result)
		}

		const abookAccess = await app.abookDb.abookWriteAccess(abook.id)
		try {
			for (const [transferEntry, metadata] of zip(
				transferEntries,
				metadataList
			)) {
				if (transferEntry.file.size === 0) return

				await abookAccess.addInternalFileExt(
					transferEntry.publicName,
					transferEntry.file,
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

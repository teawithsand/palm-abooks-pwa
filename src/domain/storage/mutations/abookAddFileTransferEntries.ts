import { AbookEntity } from "@app/domain/defines/entity/abook"
import { FileTransferEntry } from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { useMutation } from "@tanstack/react-query"

export interface AbookAddFileTransferEntityMutationArgs {
	transferEntries: FileTransferEntry[]
	abook: AbookEntity
}

export const useMutationAbookAddFileTransferEntity = () => {
	const app = useAppManager()
	return useMutation(async (args: AbookAddFileTransferEntityMutationArgs) => {
		const { abook, transferEntries } = args
		const abookAccess = await app.abookDb.abookWriteAccess(abook.id)

		try {
			for (const transferEntry of transferEntries) {
				if (transferEntry.file.size === 0) return

				await abookAccess.addInternalFileExt(
					transferEntry.publicName,
					transferEntry.file,
					(draft, entry) => draft.entries.push(entry)
				)
			}
		} finally {
			abookAccess.release()
		}
	})
}

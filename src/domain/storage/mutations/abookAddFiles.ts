import { AbookEntity } from "@app/domain/defines/entity/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useMutation } from "@tanstack/react-query"

export interface AbookAddFilesMutationArgs {
	files: File[]
	abook: AbookEntity
}

export const useMutationAbookAddFiles = () => {
	const app = useAppManager()
	return useMutation(async (args: AbookAddFilesMutationArgs) => {
		const { abook, files } = args
		const abookAccess = await app.abookDb.abookWriteAccess(abook.id)

		try {
			for (const file of files) {
				if (file.size === 0) return

				await abookAccess.addInternalFileExt(
					file.name,
					file,
					(draft, entry) => draft.entries.push(entry)
				)
			}
		} finally {
			abookAccess.release()
		}
	})
}

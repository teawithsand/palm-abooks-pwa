import { FileEntryType } from "@app/domain/defines/abookFile"
import { FileEntryEntity } from "@app/domain/defines/entity/fileEntry"
import { useAppManager } from "@app/domain/managers/app"
import { useEffect, useState } from "react"

/**
 * Does *stuff* in order to resolve FileEntryEntity provided to url.
 *
 * Never loads value if internal file format is used and corresponding blob is not stored in db.
 */
export const useFileEntryEntityUrl = (
	entry: FileEntryEntity
): string | null => {
	const app = useAppManager()
	const [url, setUrl] = useState<string | null>(null) // default image here

	if (entry.content.dataType === FileEntryType.URL) {
		return entry.content.url
	}

	// TODO(teawithsand): make this code less bloated via external helper hooks like useBlob
	useEffect(() => {
		setUrl(null)

		let isValid = true
		let url: string | null = null

		if (entry.content.dataType === FileEntryType.INTERNAL_FILE) {
			const id = entry.content.internalFileId
			const promise = async () => {
				const blob = await app.abookDb.getInternalFileBlob(id)
				if (!blob) return

				const innerUrl = URL.createObjectURL(blob)
				if (isValid) {
					url = innerUrl
					setUrl(innerUrl)
				} else {
					URL.revokeObjectURL(innerUrl)
				}
			}

			promise()
		}

		return () => {
			if (typeof url === "string") URL.revokeObjectURL(url)
			isValid = false
			setUrl(null)
		}
	}, [app, entry, setUrl])

	return url
}

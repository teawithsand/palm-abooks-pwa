import { useAppManager } from "@app/domain/managers/app"
import { MetadataLoadingResult } from "@teawithsand/tws-player"
import { useEffect, useState } from "react"

export type FileEntryId = string

export enum FileEntryType {
	INTERNAL_FILE = 1,
	URL = 2,
}

export enum FileEntryDisposition {
	UNKNOWN = 0,
	MUSIC = 1,
	IMAGE = 2,
	DESCRIPTION = 3,
}

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

export type FileEntryData =
	| {
			dataType: FileEntryType.INTERNAL_FILE
			internalFileId: string
	  }
	| {
			dataType: FileEntryType.URL
			url: string
	  }

export type FileEntry = {
	id: FileEntryId // Unique ID of this file entry, generally used for purposes of position storing
	metadata: FileEntryMetadata

	data: FileEntryData
}

export const useFileEntryUrl = (entry: FileEntry): string | null => {
	const app = useAppManager()

	if (entry.data.dataType === FileEntryType.URL) {
		return entry.data.url
	}

	const [url, setUrl] = useState<string | null>(null) // default image here

	// TODO(teawithsand): make this code less bloated via external helper hooks like useBlob
	useEffect(() => {
		let isValid = true
		let url: string | null = null

		if (entry.data.dataType === FileEntryType.INTERNAL_FILE) {
			const id = entry.data.internalFileId
			const p = async () => {
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

			p()
		}

		return () => {
			if (typeof url === "string") URL.revokeObjectURL(url)
			isValid = false
		}
	}, [app, entry])

	return url
}

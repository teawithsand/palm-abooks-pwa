import {
	FileEntry,
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { Metadata, MetadataLoadingResultType } from "@teawithsand/tws-player"
import { useMemo } from "react"

export type FileEntryShowData = {
	id: string
	name: string
	musicMetadata: Metadata | null

	fileDisposition: FileEntryDisposition

	url: string | null
	size: number | null
	storedLocally: boolean
}

export const makeFileEntryShowData = (e: FileEntry): FileEntryShowData => {
	let musicMetadata: Metadata | null = null
	if (e.metadata?.musicMetadata?.type === MetadataLoadingResultType.OK) {
		musicMetadata = e.metadata.musicMetadata.metadata
	}

	return {
		id: e.id,
		name: e.metadata.name,
		musicMetadata,
		fileDisposition: getFileEntryDisposition(e),
		storedLocally: e.data.dataType === FileEntryType.INTERNAL_FILE,
		url: e.data.dataType === FileEntryType.URL ? e.data.url : null,
		size: e.metadata.size,
	}
}

export const useFileEntryShowData = (e: FileEntry) =>
	useMemo(() => makeFileEntryShowData(e), [e])

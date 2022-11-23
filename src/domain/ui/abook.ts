import { Abook } from "@app/domain/defines/abook"
import {
	FileEntry,
	FileEntryDisposition,
	FileEntryType,
	useFileEntryUrl,
} from "@app/domain/defines/abookFile"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { MetadataBag } from "@teawithsand/tws-player"
import { generateUUID } from "@teawithsand/tws-stl"
import { useMemo } from "react"

export const DEFAULT_IMAGE_COVER_URL = "http://placekitten.com/300/300"

export type AbookShowData = {
	abook: Abook
	metadataBag: MetadataBag

	musicEntries: FileEntry[]
	imageEntries: FileEntry[]
	duration: number
}

export type AbookShowDataOptions = {
	loadCoverUrl: boolean
}

const fakeEntry: FileEntry = {
	id: generateUUID(),
	data: {
		dataType: FileEntryType.URL,
		url: "",
	},
	metadata: {
		disposition: null,
		mime: null,
		musicMetadata: null,
		name: DEFAULT_IMAGE_COVER_URL,
		size: null,
	},
}

export const makeAbookShowData = (abook: Abook): AbookShowData => {
	const musicEntries = abook.entries.filter(
		(e) => getFileEntryDisposition(e) === FileEntryDisposition.MUSIC
	)
	const imageEntries = abook.entries.filter(
		(e) => getFileEntryDisposition(e) === FileEntryDisposition.IMAGE
	)

	const metadataBag = new MetadataBag(
		musicEntries.map((e) => e.metadata.musicMetadata)
	)

	const durationMillis =
		(musicEntries.length > 0
			? metadataBag.getDurationToIndex(musicEntries.length - 1, true)
			: 0) ?? 0

	return {
		abook,
		metadataBag,
		duration: durationMillis,
		musicEntries,
		imageEntries,
	}
}

export const useAbookShowData = (abook: Abook) =>
	useMemo(() => makeAbookShowData(abook), [abook])

export const useImageFileEntryUrl = (entries: FileEntry[]): string | null => {
	entries = entries.filter(
		(e) => getFileEntryDisposition(e) === FileEntryDisposition.IMAGE
	)

	const entry = entries.length > 0 ? entries[0] : fakeEntry
	const entryUrl = useFileEntryUrl(entry)
	if (entries.length === 0) return null
	return entryUrl
}

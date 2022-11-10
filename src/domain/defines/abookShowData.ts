import { Abook } from "@app/domain/defines/abook"
import {
	FileEntry,
	FileEntryDisposition,
	FileEntryType,
	useFileEntryUrl,
} from "@app/domain/defines/abookFile"
import { useAppManager } from "@app/domain/managers/app"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { MetadataBag } from "@teawithsand/tws-player"
import { useMemo } from "react"

export type AbookShowData = {
	abook: Abook
	coverUrl: string
	metadataBag: MetadataBag

	musicEntries: FileEntry[]
	duration: number
}

export const useAbookShowData = (abook: Abook): AbookShowData => {
	const app = useAppManager()

	const musicEntries = useMemo(
		() =>
			abook.entries.filter(
				(e) => getFileEntryDisposition(e) === FileEntryDisposition.MUSIC
			),
		[abook.entries]
	)

	const cachedMetadataBag = useMemo(
		() =>
			new MetadataBag(musicEntries.map((e) => e.metadata.musicMetadata)),
		[musicEntries]
	)

	const imageEntry = useMemo(() => {
		const candidates = abook.entries.filter(
			(e) => getFileEntryDisposition(e) === FileEntryDisposition.IMAGE
		)

		const local = candidates.find(
			(c) => c.data.dataType === FileEntryType.INTERNAL_FILE
		)
		if (local) return local

		const any = candidates.length > 0 ? candidates[0] : null
		return any
	}, [abook.entries])

	const durationMillis =
		(musicEntries.length > 0
			? cachedMetadataBag.getDurationToIndex(
					musicEntries.length - 1,
					true
			  )
			: 0) ?? 0

	const imageUrl: string =
		(imageEntry ? useFileEntryUrl(imageEntry) : null) ||
		"http://placekitten.com/300/300"

	return {
		abook,
		coverUrl: imageUrl,
		metadataBag: cachedMetadataBag,

		musicEntries,
		duration: durationMillis,
	}
}

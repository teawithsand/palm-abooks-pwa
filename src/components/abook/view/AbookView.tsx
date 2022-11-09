import React, { useEffect, useMemo, useState } from "react"
import { Abook } from "@app/domain/defines/abook"
import { useAppManager } from "@app/domain/managers/app"
import {
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { MetadataBag } from "@teawithsand/tws-player"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
`

const CoverImage = styled.img`
	object-fit: cover;
	max-height: 50vh;
	max-width: 50vw;
`

const InfoList = styled.ul`
	padding: 0;
	margin: 0;
	list-style: none;
`

export const AbookView = (props: { abook: Abook }) => {
	const { abook } = props
	const { metadata } = abook
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

	const duration =
		(musicEntries.length > 0
			? cachedMetadataBag.getDurationToIndex(
					musicEntries.length - 1,
					true
			  )
			: 0) ?? 0

	const [imageUrl, setImageUrl] = useState("http://placekitten.com/300/300") // default image here

	// TODO(teawithsand): make this code less bloated via external helper hooks like useBlob
	useEffect(() => {
		if (!imageEntry) return
		if (imageEntry.data.dataType === FileEntryType.URL)
			setImageUrl(imageEntry.data.url)

		let isValid = true
		let url: string | null = null

		if (imageEntry.data.dataType === FileEntryType.INTERNAL_FILE) {
			const id = imageEntry.data.internalFileId
			const p = async () => {
				const blob = await app.abookDb.getInternalFileBlob(id)
				if (!blob) return

				const innerUrl = URL.createObjectURL(blob)
				if (isValid) {
					url = innerUrl
					setImageUrl(innerUrl)
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
	}, [app, imageEntry])

	return (
		<Grid>
			<CoverImage src={imageUrl} alt="Abook cover image" />
			<InfoList>
				<li>{metadata.title}</li>
				<li>{metadata.authorName}</li>
			</InfoList>
		</Grid>
	)
}

import React, { useEffect, useMemo, useState } from "react"
import { Abook } from "@app/domain/defines/abook"
import styled from "styled-components"
import { MetadataBag } from "@teawithsand/tws-player"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import {
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { Link } from "gatsby"

const Card = styled.div`
	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 5px;
	padding: 0.5em;

	display: grid;
	grid-template-columns: minmax(0, min-content) auto;
	grid-template-rows: auto;
	gap: 1em;
`

// TODO(teawithsand): remove it as now it became obsolete
const CardImageContainer = styled(Link)`
	overflow: hidden;
	display: block;
	grid-row: 1;
	grid-column: 1;
`

const CardImage = styled.img`
	height: 200px;
	width: 200px;
	border-radius: 5px;
	border: 2px solid rgba(0, 0, 0, 0.125);

	display: block;
	object-fit: cover;
`

const CardRightPanel = styled.div`
	grid-row: 1;
	grid-column: 2;

	display: grid;

	grid-auto-flow: row;
	grid-auto-rows: min-content;
	gap: 1em;
`

const CardHeader = styled.div`
	font-size: 1.35em;
	font-weight: bold;
`

const CardPropertiesBody = styled.ul`
	list-style-type: none;
	margin: 0;
	padding: 0;
`

export const AbookSmallCard = (props: { abook: Abook }) => {
	const { abook } = props
	const { metadata } = abook
	const app = useAppManager()
	const name = abook.metadata.title
	const { abookShowPath } = useAppPaths()

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
		<Card>
			<CardImageContainer to={abookShowPath(abook.id)}>
				<CardImage src={imageUrl} />
			</CardImageContainer>
			<CardRightPanel>
				<CardHeader>{name}</CardHeader>
				<CardPropertiesBody>
					{metadata.authorName ? (
						<li>Author: {metadata.authorName}</li>
					) : null}
					{metadata.addedAt ? (
						<li>
							Added at:{" "}
							{new Date(metadata.addedAt).toLocaleString("pl-PL")}
						</li>
					) : null}
					{metadata.lastPlayedAt ? (
						<li>
							Last played at:{" "}
							{new Date(metadata.lastPlayedAt).toLocaleString(
								"pl-PL"
							)}
						</li>
					) : (
						<li>Never played</li>
					)}
					{duration ? (
						<li>Duration: {formatDurationSeconds(duration)}</li>
					) : (
						<li>Duration not loaded or there is no files</li>
					)}
					<li>Sound files: {musicEntries.length}</li>
				</CardPropertiesBody>
			</CardRightPanel>
		</Card>
	)
}

import React, { useMemo } from "react"
import { Abook } from "@app/domain/defines/abook"
import styled from "styled-components"
import { MetadataBag } from "@teawithsand/tws-player"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import { formatDurationSeconds } from "@teawithsand/tws-stl"

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
const CardImageContainer = styled.div`
	overflow: hidden;
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
	const name = abook.metadata.title

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

	const duration =
		(musicEntries.length > 0
			? cachedMetadataBag.getDurationToIndex(
					musicEntries.length - 1,
					true
			  )
			: 0) ?? 0

	return (
		<Card>
			<CardImageContainer>
				<CardImage src="http://placekitten.com/200/300" />
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

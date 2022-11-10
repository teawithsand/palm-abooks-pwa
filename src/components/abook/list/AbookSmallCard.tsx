import { Abook } from "@app/domain/defines/abook"
import { useAbookShowData } from "@app/domain/defines/abookShowData"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import { Link } from "gatsby"
import React from "react"
import styled from "styled-components"

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

	const { coverUrl, musicEntries, duration } = useAbookShowData(abook)

	return (
		<Card>
			<CardImageContainer to={abookShowPath(abook.id)}>
				<CardImage src={coverUrl} />
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

import { AbookFormAddFiles } from "@app/components/abook/form/addFiles"
import { AbookFileList } from "@app/components/abook/view/AbookFileList"
import { Abook } from "@app/domain/defines/abook"
import { useAbookShowData } from "@app/domain/defines/abookShowData"
import { useAppPaths } from "@app/paths"
import { LinkContainer } from "@app/util/LinkContainer"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import { breakpointMediaDown, BREAKPOINT_SM } from "@teawithsand/tws-stl-react"
import React from "react"
import { Button } from "react-bootstrap"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

const Header = styled.div`
	display: grid;
	grid-auto-flow: column;
	width: 100%;

	grid-template-columns: minmax(0, auto) min-content;

	@media ${breakpointMediaDown(BREAKPOINT_SM)} {
		grid-auto-flow: row;
		grid-template-columns: minmax(0, auto);
	}

	gap: 0.5em;
`

const CoverImage = styled.img`
	object-fit: cover;

	width: 300px;
	height: 300px;

	max-height: 80vh;
	max-width: 80vw;

	@media ${breakpointMediaDown(BREAKPOINT_SM)} {
		width: 100%;
		margin-left: auto;
		margin-right: auto;
		grid-row: 1;
		grid-column: 1;
	}

	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 10px;
`

const InfoList = styled.ul`
	padding: 0;
	margin: 0;
	list-style: none;

	grid-row: 1;
	grid-column: 1;

	@media ${breakpointMediaDown(BREAKPOINT_SM)} {
		grid-column: 1;
		grid-row: 2;
	}

	width: 100%;
	height: 100%;

	display: grid;
	grid-auto-flow: row;

	border-radius: 10px;
	overflow: hidden;

	vertical-alignment: middle;

	li {
		font-size: 1.25em;
		padding: 0.5rem;

		display: grid;
		align-items: center;
		justify-items: left;
	}

	li:first-child {
		font-size: 1.75em;
		font-weight: bold;
	}

	li:nth-child(2n) {
		background-color: rgba(0, 0, 0, 0.125);
	}

	li:nth-child(2n + 1) {
		background-color: rgba(0, 0, 0, 0.25);
	}

	li:last-child {
	}
`

const ActionsList = styled.div`
	padding-top: 0.5em;
	padding-bottom: 0.5em;
	grid-row: 2;
	grid-column: 1 / 3;

	@media ${breakpointMediaDown(BREAKPOINT_SM)} {
		grid-column: 1;
		grid-row: 3;
	}

	display: flex;
	flex-flow: row;
	flex-wrap: wrap;
	gap: 1em;

	& > * {
		flex: 1 1 0;
	}
`

export const AbookView = (props: { abook: Abook }) => {
	const { abook } = props
	const { metadata } = abook
	const { abookEditMetadataPath,  abookDeletePath } = useAppPaths()
	const { coverUrl, musicEntries, duration } = useAbookShowData(abook)

	return (
		<Grid>
			<Header>
				<InfoList>
					<li>Title: {metadata.title}</li>
					<li>Author name: {metadata.authorName || "-"}</li>
					<li>Duration: {formatDurationSeconds(duration)}</li>
					<li>Music files: {musicEntries.length}</li>
					<li>
						Description: {metadata.description || "No description"}
					</li>
				</InfoList>
				<CoverImage src={coverUrl} alt="Abook cover image" />
				<ActionsList>
					<LinkContainer to={abookEditMetadataPath(abook.id)}>
						<Button href="#">Edit metadata</Button>
					</LinkContainer>
					<LinkContainer to={abookDeletePath(abook.id)}>
					<Button href="#" variant="danger" onClick={() => {}}>
						Delete
					</Button>
					</LinkContainer>
				</ActionsList>
			</Header>
			<AbookFileList entries={abook.entries} />
			<AbookFormAddFiles
				onSubmit={async (d) => {
					// + here invalidate react-query in order to trigger abook reload
					// do nothing
				}}
			/>
		</Grid>
	)
}

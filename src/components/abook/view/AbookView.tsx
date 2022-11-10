import { AbookFileList } from "@app/components/abook/view/AbookFileList"
import { Abook } from "@app/domain/defines/abook"
import { useAbookShowData } from "@app/domain/defines/abookShowData"
import { useAppManager } from "@app/domain/managers/app"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import { breakpointMediaDown, BREAKPOINT_SM } from "@teawithsand/tws-stl-react"
import React from "react"
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
		grid-template-columns: auto;
	}

	gap: 0.5em;
`

const CoverImage = styled.img`
	object-fit: cover;

	width: 300px;
	height: 300px;

	@media ${breakpointMediaDown(BREAKPOINT_SM)} {
		width: auto;
		height: auto;
		grid-row: 1;
	}

	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 10px;
`

const InfoList = styled.ul`
	padding: 0;
	margin: 0;
	list-style: none;

	flex-grow: 1;
	width: 100%;
	height: 100%;

	display: grid;
	grid-auto-flow: row;
	height: fit-content;

	border-radius: 10px;
	overflow: hidden;

	li {
		font-size: 1.25em;
		padding: 0.5rem;
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
		display: block;
	}
`

const TitleRow = styled.li``

export const AbookView = (props: { abook: Abook }) => {
	const { abook } = props
	const { metadata } = abook

	const { coverUrl, musicEntries, duration } = useAbookShowData(abook)

	return (
		<Grid>
			<Header>
				<InfoList>
					<TitleRow>Title: {metadata.title}</TitleRow>
					<li>Author name: {metadata.authorName || "-"}</li>
					<li>Duration: {formatDurationSeconds(duration)}</li>
					<li>Music files: {musicEntries.length}</li>
				</InfoList>
				<CoverImage src={coverUrl} alt="Abook cover image" />
			</Header>
			<AbookFileList entries={abook.entries} />
		</Grid>
	)
}

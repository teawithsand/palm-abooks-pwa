import { PlayerEntriesDisplayData } from "@app/components/player/PlayerEntriesDisplay"
import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import { MetadataLoadingResultType } from "@teawithsand/tws-player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import React from "react"
import styled from "styled-components"

type RowAttrs = {
	$isPlaying: boolean
}

const Row = styled.li.attrs<RowAttrs>(({ $isPlaying }) => ({
	style: {
		fontWeight: $isPlaying ? "bold" : "normal",
	},

	className: $isPlaying ? "is-playing" : "",
}))<RowAttrs>`
	display: grid;
	grid-template-rows: auto auto;
	grid-template-columns: auto;

	grid-auto-flow: row;

	padding: 0.5em 0.7em;
`

const Name = styled.div``
const Metadata = styled.div``

export const PlayerEntrySmallDisplay = (
	props: {
		entry: PlayableEntry
		onClick?: () => void
		index: number
	} & PlayerEntriesDisplayData
) => {
	const { entry, onClick, index, metadataBag, currentPosition } = props
	let name = `Entry #${entry.id}`

	const isPlaying = entry.id === props.currentEntryId

	let duration: number | null = null

	const res = metadataBag.getResult(index)
	if (
		res &&
		res.type === MetadataLoadingResultType.OK &&
		res.metadata.duration !== null &&
		res.metadata.duration >= 0
	)
		duration = res.metadata.duration

	if (entry.type === PlayableEntryType.FILE_ENTRY) {
		name = entry.entry.metadata.name
	} else if (entry.type === PlayableEntryType.ARBITRARY_BLOB) {
		name =
			entry.blob instanceof File
				? entry.blob.name
				: `Sound blob #${entry.id}`
	} else if (entry.type === PlayableEntryType.ARBITRARY_URL) {
		name = entry.url
	}
	/*
	return (
		<Row onClick={onClick} $isPlaying={isPlaying}>
			#{index + 1} {name} -{" "}
			{isPlaying && currentPosition !== null
				? `${formatDurationSeconds(currentPosition)} / `
				: null}{" "}
			{formatDurationSeconds(duration ?? 0)}
		</Row>
	)*/

	// <OrdinalNumber>{formatIndex(index + 1)}</OrdinalNumber>
	// ON has to be displayed by parent grid in order to fix all cells width
	// in future subgrid or sth like that could be used
	return (
		<Row onClick={onClick} $isPlaying={isPlaying}>
			<Name>{name}</Name>
			<Metadata>{formatDurationSeconds(duration ?? 0)}</Metadata>
		</Row>
	)
}

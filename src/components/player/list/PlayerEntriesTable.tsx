import {
	PlayerEntriesDisplayCallbacks,
	PlayerEntriesDisplayData,
} from "@app/components/player/list/types"
import { PlayableEntryType } from "@app/domain/defines/player/playableEntry"
import { MetadataLoadingResultType } from "@teawithsand/tws-player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import React from "react"
import { Table } from "react-bootstrap"
import styled from "styled-components"

const ParentTable = styled(Table)`
	width: 100%;
`
type RowAttrs = {
	$isPlaying: boolean
}
const Row = styled.tr.attrs<RowAttrs>(({ $isPlaying }) => ({
	style: {
		fontWeight: $isPlaying ? "bold" : "normal",
	},
}))<RowAttrs>``

const OrdinalNumber = styled.td`
	// text-align: center;
	// vertical-align: middle;
`

const Name = styled.td`
	white-space: normal !important;
	word-wrap: break-word;
`
const Duration = styled.td``

export const PlayerEntriesTable = (
	props: PlayerEntriesDisplayData & PlayerEntriesDisplayCallbacks
) => {
	const { whatToPlayData, jumpToEntry, metadataBag, currentPosition } = props

	const onClickFactory = (i: number) => {
		if (!jumpToEntry) return undefined

		return () => {
			jumpToEntry(whatToPlayData.entries[i].id)
		}
	}

	return (
		<ParentTable striped bordered hover>
			<thead>
				<tr>
					<th>#</th>
					<th>Name</th>
					<th>Position / Duration</th>
				</tr>
			</thead>
			<tbody>
				{whatToPlayData.entries.map((entry, index) => {
					let name = `Entry #${entry.id}`

					const isPlaying = entry.id === props.currentEntryId

					let duration: number | null = null

					const metadata = metadataBag.getResult(index)
					if (
						metadata &&
						metadata.type === MetadataLoadingResultType.OK &&
						metadata.metadata.duration !== null &&
						metadata.metadata.duration >= 0
					) {
						duration = metadata.metadata.duration
					}

					if (
						metadata &&
						metadata.type === MetadataLoadingResultType.OK &&
						metadata.metadata.title
					) {
						name = `${metadata.metadata.artist || "No artist"} - ${
							metadata.metadata.title
						}`
					} else if (entry.type === PlayableEntryType.FILE_ENTRY) {
						name = entry.entry.metadata.name
					} else if (
						entry.type === PlayableEntryType.ARBITRARY_BLOB
					) {
						name =
							entry.blob instanceof File
								? entry.blob.name
								: `Sound blob #${entry.id}`
					} else if (entry.type === PlayableEntryType.ARBITRARY_URL) {
						name = entry.url
					}

					return (
						<Row
							key={index}
							$isPlaying={isPlaying}
							onClick={onClickFactory(index)}
						>
							<OrdinalNumber>{index + 1}</OrdinalNumber>
							<Name>{name}</Name>
							<Duration>
								{isPlaying && currentPosition !== null
									? formatDurationSeconds(currentPosition) +
									  " / "
									: ""}
								{duration
									? formatDurationSeconds(duration)
									: "No duration"}
								{isPlaying &&
								currentPosition !== null &&
								duration
									? ` ${String(
											Math.round(
												((currentPosition ?? 0) /
													duration) *
													100
											)
									  ).padStart(3, " ")}%`
									: ""}
							</Duration>
						</Row>
					)
				})}
			</tbody>
		</ParentTable>
	)
}

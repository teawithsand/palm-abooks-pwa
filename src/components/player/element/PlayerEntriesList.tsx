import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import {
	MetadataLoadingResultType,
	isTimeNumber,
} from "@teawithsand/tws-player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import React from "react"
import styled from "styled-components"

type RowAttrs = {
	$isPlaying: boolean
	$clickable: boolean
}
const Row = styled.li.attrs<RowAttrs>(({ $isPlaying, $clickable }) => ({
	style: {
		fontWeight: $isPlaying ? "bold" : "normal",
		//backgroundColor: $isPlaying ? "rgba(rgb(51, 153, 255) 0.25)" : undefined,
		//boxShadow: $isPlaying ? "rgba(0, 0, 0, 0.24) 0px 3px 8px" : undefined,
		paddingLeft: $isPlaying ? ".3em" : undefined,
		cursor: $clickable ? "pointer" : "",
	},
}))<RowAttrs>`
	display: grid;
	grid-template-columns: min-content auto;
	grid-template-rows: 1fr 1fr;
	grid-auto-flow: row;

	column-gap: 1ex;
`

const List = styled.ul`
	padding: 0;
	margin: 0;
	list-style-type: none;

	display: grid;
	grid-auto-flow: row;
	grid-template-rows: 1fr;

	> *:nth-child(2n) {
		background-color: rgba(0, 0, 0, 0.125);
	}

	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 5px;

	width: 100%;
	height: fit-content;
`

const OrdinalNumber = styled.div`
	word-break: keep-all;
	white-space: nowrap;

	height: 100%;
	width: 100%;

	grid-row: 1 / 3;

	display: grid;
	justify-items: center;
	align-items: center;
	padding-left: 0.3em;
`

const TopInfo = styled.div`
	grid-row: 1;
	grid-column: 2;
`

const BottomInfo = styled.div`
	font-size: 0.9em;
	opacity: 0.75;

	grid-row: 2;
	grid-column: 2;
`

const InvisibleInline = styled.span`
	display: inline;
	visibility: hidden;
	opacity: 0;
`

// TODO(teawithsand): make this list base for reordering files stuff in abook view
export const PlayerEntriesList = (props: {
	onEntryClick?: (id: string, e: PlayableEntry) => void
}) => {
	const ui = useUiPlayerData()
	const actions = useAppManager().playerActionsManager
	const {
		onEntryClick = (id) => {
			actions.jump(id)
		},
	} = props

	if (!ui) return <List></List>

	// TODO(teawithsand): make this more performant by adding intermediate level component for row
	return (
		<List>
			{ui.entries.map((element, index) => {
				let name = `Entry #${element.id}`

				const isPlaying =
					element.id === ui.currentPosition.currentEntryId

				let duration: number | null = null

				const metadata = ui.metadataBag.getResult(index)
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
				} else if (element.type === PlayableEntryType.FILE_ENTRY) {
					name = element.entry.name
				} else if (element.type === PlayableEntryType.ARBITRARY_BLOB) {
					name =
						element.blob instanceof File
							? element.blob.name
							: `Sound blob #${element.id}`
				} else if (element.type === PlayableEntryType.ARBITRARY_URL) {
					name = element.url
				}

				// Hack: calculate padding for these entries, so that we
				// do not have to use grid or table to have numbers in list aligned
				const padding = "0".repeat(
					ui.entries.length.toString().length -
						(index + 1).toString().length
				)

				let bottomInfoProgress = ""

				let startsAtNotice = ""
				const startsAtTime = ui.metadataBag.getDurationToIndex(index)
				if (
					startsAtTime !== null &&
					isTimeNumber(startsAtTime) &&
					duration !== null &&
					isTimeNumber(duration)
				) {
					startsAtNotice = `From ${formatDurationSeconds(
						startsAtTime / 1000
					)} To ${formatDurationSeconds(
						(startsAtTime + duration) / 1000
					)}`
				}

				bottomInfoProgress = bottomInfoProgress.trim()

				if (
					isPlaying &&
					duration !== null &&
					duration >= 0 &&
					ui.currentPosition.currentEntryPosition !== null
				) {
					bottomInfoProgress = `${formatDurationSeconds(
						ui.currentPosition.currentEntryPosition / 1000
					)} / ${formatDurationSeconds(
						duration / 1000
					)} ${startsAtNotice}`
				} else if (duration !== null && duration >= 0) {
					bottomInfoProgress = `${formatDurationSeconds(
						duration / 1000
					)} ${startsAtNotice}`
				}

				return (
					<Row
						key={index}
						$isPlaying={isPlaying}
						onClick={() => {
							onEntryClick(element.id, element)
						}}
						$clickable={true}
					>
						<OrdinalNumber>
							<span>
								#{index + 1}
								<InvisibleInline>{padding}</InvisibleInline>
							</span>
						</OrdinalNumber>
						<TopInfo>{name}</TopInfo>
						<BottomInfo>{bottomInfoProgress}</BottomInfo>
					</Row>
				)
			})}
		</List>
	)
}

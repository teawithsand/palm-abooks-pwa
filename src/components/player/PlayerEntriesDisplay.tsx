import { PlayerEntrySmallDisplay } from "@app/components/player/PlayerEntryDisplay"
import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import { useAppManager } from "@app/domain/managers/app"
import { WhatToPlayData } from "@app/domain/managers/whatToPlayManager"
import { MetadataBag, MetadataLoadingResultType } from "@teawithsand/tws-player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React, { useMemo } from "react"
import styled from "styled-components"

export const usePlayerEntriesDisplayData =
	(): PlayerEntriesDisplayData | null => {
		const app = useAppManager()

		const whatToPlayData = useStickySubscribable(app.whatToPlayManager.bus)
		if (!whatToPlayData) return null

		const currentEntryId = useStickySubscribableSelector(
			app.playerManager.playerStateBus,
			(s) => s.innerState.config.currentSourceKey
		)

		const outerMetadataBag = useStickySubscribableSelector(
			app.whatToPlayManager.bus,
			(s) => s?.metadata
		)

		const metadataBag = useMemo(
			() => outerMetadataBag ?? new MetadataBag([]),
			[outerMetadataBag]
		)

		const currentPosition = useStickySubscribableSelector(
			app.playerManager.playerStateBus,
			(s) => s.innerState.position
		)

		return {
			whatToPlayData,
			currentEntryId,
			metadataBag,
			currentPosition,
		}
	}

export type PlayerEntriesDisplayData = {
	whatToPlayData: WhatToPlayData
	currentEntryId: string | null
	metadataBag: MetadataBag
	currentPosition: number | null
}

export type PlayerEntriesDisplayCallbacks = {
	jumpToEntry?: (id: string) => void
}

const List = styled.ol`
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: min-content auto;

	padding: 0;
	margin: 0;
	list-style-type: none;

	margin-left: 20vw;
	margin-right: 20vw;

	font-size: 1.2em;

	& > * {
		cursor: pointer;
	}

	// Set border-radius for table
	// hack is required, as ordinal number is part of grid rather than part of row display
	> *:nth-child(1) {
		border-radius: 5px 0 0 0;
	}
	> *:nth-child(2) {
		border-radius: 0 5px 0 0;
	}
	> *:nth-last-child(1) {
		border-radius: 0 0 5px 0;
	}
	> *:nth-last-child(2) {
		border-radius: 0 0 0 5px;
	}

	> *:nth-child(4n),
	> *:nth-child(4n - 1) {
		background-color: rgba(0, 0, 0, 0.125);
	}

	> *:nth-child(4n - 2),
	> *:nth-child(4n - 3) {
		background-color: rgba(0, 0, 0, 0.1875);
	}

	> *.is-playing:nth-child(2n) {
		background-color: red;
	}
	> *.is-playing:nth-child(2n - 1) {
		background-color: red;
	}
`

const OrdinalNumber = styled.div`
	display: grid;
	justify-items: center;
	align-items: center;
	height: 100%;

	word-wrap: nowrap;
	white-space: pre;
	width: 100%;

	padding: 0.35em;
`
export const PlayerEntriesDisplay = (
	props: PlayerEntriesDisplayData & PlayerEntriesDisplayCallbacks
) => {
	const { whatToPlayData, jumpToEntry, currentEntryId } = props

	const onClickFactory = (i: number) => {
		if (!jumpToEntry) return undefined
		return undefined
	}

	return (
		<List>
			{whatToPlayData.entries.map((e, i) => (
				<>
					<OrdinalNumber
						onClick={onClickFactory(i)}
						className={e.id === currentEntryId ? "is-playing" : ""}
					>
						{i + 1}
					</OrdinalNumber>
					<PlayerEntrySmallDisplay
						{...props}
						onClick={onClickFactory(i)}
						key={i}
						entry={e}
						index={i}
					/>
				</>
			))}
		</List>
	)
}

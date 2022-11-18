import { useUiPlayerData } from "@app/domain/ui/player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import React from "react"
import styled from "styled-components"

const Bar = styled.div`
	display: grid;

	grid-template-rows: auto;
	grid-template-columns: auto 1fr auto;
	width: 100%;
`

const Left = styled.div`
	text-align: left;
`

const Right = styled.div`
	text-align: right;
`

const Middle = styled.div`
	text-align: center;
`

export const PlayerLocalProgressDisplay = () => {
	const uiData = useUiPlayerData()
	const lastValidPosition = uiData?.lastValidPosition

	const duration = lastValidPosition?.currentEntryDuration ?? 0
	const position = lastValidPosition?.currentEntryPosition ?? 0

	return (
		<Bar>
			<Left>
				{position !== null
					? formatDurationSeconds(position)
					: formatDurationSeconds(0)}
			</Left>
			<Middle>
				{duration
					? `Played ${Math.floor(
							(position / duration) * 100
					  )}%; ${formatDurationSeconds(duration - position)} left`
					: null}
			</Middle>
			<Right>
				{duration !== null
					? formatDurationSeconds(duration)
					: formatDurationSeconds(0)}
			</Right>
		</Bar>
	)
}

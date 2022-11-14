import { useUiPlayerData } from "@app/domain/ui/player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import React from "react"
import styled from "styled-components"

const Bar = styled.div`
	display: grid;

	grid-template-rows: auto;
	grid-template-columns: 1fr 1fr;
	width: 100%;
`

const Left = styled.div`
	text-align: left;
`

const Right = styled.div`
	text-align: right;
`

export const PlayerGlobalProgressDisplay = () => {
	const uiData = useUiPlayerData()
	const lastValidPosition = uiData?.lastValidPosition

	const duration = lastValidPosition?.currentGlobalDuration ?? 0
	const position = lastValidPosition?.currentGlobalPosition ?? 0

	return (
		<Bar>
			<Left>
				{position !== null
					? formatDurationSeconds(position)
					: formatDurationSeconds(0)}
			</Left>
			<Right>
				{duration !== null
					? formatDurationSeconds(duration)
					: formatDurationSeconds(0)}
			</Right>
		</Bar>
	)
}

import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import React from "react"
import styled from "styled-components"

import { Form } from "react-bootstrap"

const Bar = styled.div``

export const PlayerLocalProgressBar = () => {
	const uiData = useUiPlayerData()
	const lastValidPosition = uiData?.lastValidPosition
	const actions = useAppManager().playerActionsManager

	const duration = lastValidPosition?.currentEntryDuration ?? 0
	const position = lastValidPosition?.currentEntryPosition ?? 0

	return (
		<Bar>
			<Form.Range
				min={0}
				max={duration}
				value={position}
				disabled={
					uiData?.isPositionCorrupted ||
					(lastValidPosition?.currentEntryDuration ?? null) ===
						null ||
					(lastValidPosition?.currentEntryPosition ?? null) === null
				}
				onInput={(v) => {
					if (v.isTrusted) {
						const value = parseInt((v.target as any).value)
						if (!isFinite(value) || value < 0) return
						actions.localSeek(value)
					}
				}}
			/>
		</Bar>
	)
}

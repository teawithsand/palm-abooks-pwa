import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import React, { ChangeEvent, useCallback, useRef } from "react"
import styled from "styled-components"

import { Form } from "react-bootstrap"

const Bar = styled.div``

export const PlayerGlobalProgressBar = () => {
	const uiData = useUiPlayerData()
	const lastValidPosition = uiData?.lastValidPosition
	const actions = useAppManager().playerActionsManager

	const duration = lastValidPosition?.currentGlobalDuration ?? 0
	const position = lastValidPosition?.currentGlobalPosition ?? 0

	const lastEventTimestampRef = useRef<number | null>(null)
	const wasPlayingRef = useRef<boolean | null>(null)

	const onChange = useCallback(
		(e: ChangeEvent) => {
			if (!e.isTrusted) return

			const lastTimestamp = lastEventTimestampRef.current
			if (lastTimestamp !== null) {
				if (e.timeStamp < lastTimestamp) return
			}
			lastEventTimestampRef.current = e.timeStamp

			const value = parseInt((e.target as any).value)
			if (!isFinite(value) || value < 0) return
			actions.globalSeek(value)
		},
		[actions, lastEventTimestampRef]
	)

	const onDown = useCallback(() => {
		wasPlayingRef.current = uiData?.isPlaying ?? null
		if (wasPlayingRef.current === true) {
			actions.setIsPlaying(false)
		}
	}, [wasPlayingRef, uiData?.isPlaying, actions])

	const onUp = useCallback(() => {
		const { current } = wasPlayingRef
		if (current !== null) actions.setIsPlaying(current)
	}, [actions, wasPlayingRef])

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
				onPointerDown={onDown}
				onPointerUp={onUp}
				onChange={onChange}
			/>
		</Bar>
	)
}

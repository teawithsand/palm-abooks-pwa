import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerDataInterval } from "@app/domain/ui/player"
import React, { useCallback, useRef, useState } from "react"
import styled from "styled-components"

import { Form } from "react-bootstrap"

const Bar = styled.div``

export const PlayerGlobalProgressBar = () => {
	const [uiData, refresh] = useUiPlayerDataInterval(500)
	const lastValidPosition = uiData?.lastValidPosition
	const actions = useAppManager().playerActionsManager

	const duration = lastValidPosition?.currentGlobalDuration ?? 0
	const position = lastValidPosition?.currentGlobalPosition ?? 0

	const lastEventTimestampRef = useRef<number | null>(null)
	const wasPlayingRef = useRef<boolean | null>(null)
	const isClickedRef = useRef<boolean>(false)

	const [valueOverride, setValueOverride] = useState<number | null>(null)
	const seekToRef = useRef<number | null>(null)

	const onChange = useCallback(
		(e: any) => {
			if (!e.isTrusted || !isClickedRef.current) return

			const lastTimestamp = lastEventTimestampRef.current
			if (lastTimestamp !== null) {
				if (e.timeStamp < lastTimestamp) return
			}
			lastEventTimestampRef.current = e.timeStamp

			const value = parseInt((e.target as any).value)
			if (!isFinite(value) || value < 0) return
			seekToRef.current = value
			setValueOverride(value)
		},
		[isClickedRef, lastEventTimestampRef, actions]
	)

	const onDown = useCallback(() => {
		isClickedRef.current = true
		wasPlayingRef.current = uiData?.isPlaying ?? null
		if (wasPlayingRef.current === true) {
			actions.setIsPlaying(false, false)
		}
	}, [wasPlayingRef, isClickedRef, uiData?.isPlaying, actions])

	const onUp = useCallback(() => {
		isClickedRef.current = false
		const { current } = wasPlayingRef
		if (current !== null) actions.setIsPlaying(current, false)
		const value = seekToRef.current
		if (value !== null) {
			actions.globalSeek(value)
		}
		setValueOverride(null)
		refresh()
	}, [wasPlayingRef, isClickedRef, refresh])

	return (
		<Bar>
			<Form.Range
				min={0}
				max={duration}
				value={valueOverride ?? position}
				disabled={
					uiData?.isPositionCorrupted ||
					(lastValidPosition?.currentGlobalDuration ?? null) ===
						null ||
					(lastValidPosition?.currentGlobalPosition ?? null) === null
				}
				onPointerDown={onDown}
				onPointerUp={onUp}
				onPointerCancel={onUp}
				onInput={onChange}
			/>
		</Bar>
	)
}

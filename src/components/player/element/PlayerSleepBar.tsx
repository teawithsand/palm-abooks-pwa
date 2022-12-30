import { useAppManager } from "@app/domain/managers/app"
import React, { useEffect, useState } from "react"
import styled from "styled-components"

import { SleepManagerStateType } from "@app/domain/managers/sleep/sleepManager"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import {
	formatDurationSeconds,
	getNowPerformanceTimestamp,
} from "@teawithsand/tws-stl"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"

const Bar = styled.div`
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: 1fr;

	gap: 1em;

	overflow: hidden;
	width: 100%;

	justify-items: center;
	cursor: pointer;
`

export const PlayerSleepBar = () => {
	const app = useAppManager()

	const sleepState = useStickySubscribable(app.sleepManager.bus)

	let inner = null

	const [now, setNow] = useState<number | null>(null)
	useEffect(() => {
		const interval = setInterval(() => {
			setNow(getNowPerformanceTimestamp())
		})
		return () => {
			clearInterval(interval)
		}
	}, [])

	const navigate = useNavigate()
	const { playerOptionsPath } = useAppPaths()

	if (sleepState.type === SleepManagerStateType.ENABLED) {
		const millisLeft = Math.max(
			sleepState.startedTimestamps.perf -
				(now || getNowPerformanceTimestamp()) +
				sleepState.config.baseDuration +
				sleepState.config.turnVolumeDownDuration,
			0
		)
		inner = `Left ${formatDurationSeconds(
			millisLeft / 1000
		)} out of ${formatDurationSeconds(
			(sleepState.config.baseDuration +
				sleepState.config.turnVolumeDownDuration) /
				1000
		)}`
	} else if (sleepState.type === SleepManagerStateType.ENABLED_BUT_STOPPED) {
		inner = `Left ${formatDurationSeconds(
			(sleepState.config.baseDuration +
				sleepState.config.turnVolumeDownDuration) /
				1000
		)} out of ${formatDurationSeconds(
			(sleepState.config.baseDuration +
				sleepState.config.turnVolumeDownDuration) /
				1000
		)}`
	} else if (sleepState.type === SleepManagerStateType.DISABLED) {
		inner = `Sleep not set`
	}

	return (
		<Bar
			onClick={() => {
				navigate(playerOptionsPath)
			}}
		>
			{inner}
		</Bar>
	)
}

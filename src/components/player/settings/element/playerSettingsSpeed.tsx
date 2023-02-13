import { INIT_GLOBAL_PLAYER_CONFIG } from "@app/domain/defines/config/config"
import { useAppManager } from "@app/domain/managers/app"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import React from "react"
import { Button, Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
`

const rangeGrowFactor = 20

// TODO(teawithsand): refactor Form.Check used in order to provide proper label HTML element usage
// so text next to checkboxes are clickable

export const PlayerSettingsSpeedSection = () => {
	const app = useAppManager()
	const speed = useStickySubscribableSelector(
		app.playerManager.playerStateBus,
		(state) => state.innerState.config.speed
	)
	const preservePitchForSpeed = useStickySubscribableSelector(
		app.playerManager.playerStateBus,
		(state) => state.innerState.config.preservePitchForSpeed
	)
	const actions = app.playerActionsManager
	return (
		<Container>
			<h3>Speed (Current: {Math.round(speed * 100) / 100}x)</h3>
			<Form.Range
				min={Math.ceil(0.15 * rangeGrowFactor)}
				max={Math.floor(4 * rangeGrowFactor)}
				step={1}
				value={Math.round(speed * rangeGrowFactor)}
				onInput={(v) => {
					if (v.isTrusted) {
						const value = parseInt((v.target as any).value)
						if (!isFinite(value) || value < 0) return
						actions.setSpeed(value / rangeGrowFactor)
					}
				}}
			/>
			<Form.Check
				checked={preservePitchForSpeed}
				label="Preserve pitch for speed"
				onChange={(v) => {
					actions.setPreservePitchForSpeed(!!v.target.checked)
				}}
			/>
			<Button
				onClick={() => {
					actions.setPreservePitchForSpeed(
						INIT_GLOBAL_PLAYER_CONFIG.preservePitchForSpeed
					)
					actions.setSpeed(INIT_GLOBAL_PLAYER_CONFIG.speed)
				}}
			>
				Reset speed settings to defaults
			</Button>
		</Container>
	)
}

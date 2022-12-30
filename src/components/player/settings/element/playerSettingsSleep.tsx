import { INIT_GLOBAL_PLAYER_CONFIG } from "@app/domain/defines/config/config"
import { useAppManager } from "@app/domain/managers/app"
import { SleepManagerStateType } from "@app/domain/managers/sleep/sleepManager"
import { useUiPlayerData } from "@app/domain/ui/player"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React from "react"
import { Button, Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
`

export const PlayerSettingsSleepSection = () => {
	const app = useAppManager()
	const sleepConfig =
		useStickySubscribable(app.configManager.globalPlayerConfig.bus)
			?.sleepConfig || INIT_GLOBAL_PLAYER_CONFIG.sleepConfig
	const actions = app.playerActionsManager
	const resetSleepIfNeeded = () => actions.resetSleep()

	return (
		<Container>
			<h3>Sleep</h3>
			<h4>
				Duration:{" "}
				{formatDurationSeconds(
					(sleepConfig.baseDuration +
						sleepConfig.turnVolumeDownDuration) /
						1000
				)}
			</h4>
			<Form.Range
				min={5 * 60 * 1000}
				max={6 * 60 * 60 * 1000}
				step={5 * 60 * 1000}
				value={sleepConfig.baseDuration}
				onInput={(v) => {
					if (v.isTrusted) {
						app.configManager.globalPlayerConfig.update((draft) => {
							const value = parseInt((v.target as any).value)
							if (!isFinite(value) || value < 0) return

							draft.sleepConfig = {
								...sleepConfig,
								baseDuration:
									value - sleepConfig.turnVolumeDownDuration,
							}
						})
						resetSleepIfNeeded()
					}
				}}
			/>
			<Form.Check
				label="Turn volume down before pause"
				checked={sleepConfig.turnVolumeDownDuration !== 0}
				onChange={(v) => {
					const newTurnVolumeDownDuration = v.target.checked
						? 10 * 1000
						: 0
					console.log({
						checked: v.target.checked,
						newTurnVolumeDownDuration,
					})

					app.configManager.globalPlayerConfig.update((draft) => {
						draft.sleepConfig = {
							...sleepConfig,
							baseDuration:
								sleepConfig.baseDuration -
								(newTurnVolumeDownDuration -
									sleepConfig.turnVolumeDownDuration),
							turnVolumeDownDuration: newTurnVolumeDownDuration,
						}
					})

					resetSleepIfNeeded()
				}}
			/>
			<Form.Check
				label="Enabled"
				checked={
					app.sleepManager.bus.lastEvent.type ===
						SleepManagerStateType.ENABLED ||
					app.sleepManager.bus.lastEvent.type ===
						SleepManagerStateType.ENABLED_BUT_STOPPED
				}
				onChange={(v) => {
					if (v.target.checked) {
						app.playerActionsManager.setSleepFromConfig()
					}else{
						app.playerActionsManager.unsetSleep()
					}
				}}
			/>
		</Container>
	)
}

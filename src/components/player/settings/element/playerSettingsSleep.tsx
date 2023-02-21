import { SleepConfig } from "@app/domain/defines/config/sleep"
import { useAppManager } from "@app/domain/managers/app"
import { SleepManagerStateType } from "@app/domain/managers/newPlayer/sleep/sleepManager"
import { useConfig, useConfigUpdater } from "@teawithsand/tws-config"
import { formatDurationSeconds } from "@teawithsand/tws-stl"
import React from "react"
import { Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
`

export const PlayerSettingsSleepSection = () => {
	const app = useAppManager()
	const sleepConfig = useConfig(
		app.configManager.globalPlayerConfig
	).sleepConfig
	const updater = useConfigUpdater(app.configManager.globalPlayerConfig)
	const actions = app.playerActionsManager

	const updateSleepConfig = (newSleepConfig: SleepConfig) => {
		updater.updateConfig((draft) => {
			draft.sleepConfig = newSleepConfig
		})
		updater.save()

		actions.setSleepFromConfig()
	}

	const setSleepEnabled = (enabled: boolean) => {
		updater.updateConfig((draft) => {
			draft.isSleepEnabled = enabled
		})
		updater.save()

		actions.setSleepFromConfig()
	}

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
						const value = parseInt((v.target as any).value)
						if (!isFinite(value) || value < 0) return

						updateSleepConfig({
							...sleepConfig,
							baseDuration:
								value - sleepConfig.turnVolumeDownDuration,
						})
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

					updateSleepConfig({
						...sleepConfig,
						baseDuration:
							sleepConfig.baseDuration -
							(newTurnVolumeDownDuration -
								sleepConfig.turnVolumeDownDuration),
						turnVolumeDownDuration: newTurnVolumeDownDuration,
					})
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
					setSleepEnabled(v.target.checked)
				}}
			/>
			<Form.Check
				label="Shaking resets sleep"
				checked={sleepConfig.shakeResetsSleep}
				disabled={!app.shakeManager.isSupported}
				onChange={(v) => {
					const checked = v.target.checked
					updateSleepConfig({
						...sleepConfig,
						shakeResetsSleep: checked,
					})
				}}
			/>
		</Container>
	)
}

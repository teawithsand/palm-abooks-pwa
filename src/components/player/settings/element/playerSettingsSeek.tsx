import { PlayerSeekActionPicker } from "@app/components/player/settings/playerSeekActionPicker"
import { useAppManager } from "@app/domain/managers/app"
import { useConfigOrDefault, useConfigUpdater } from "@teawithsand/tws-config"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	gap: 0.4em;
`

const Section = styled.div``

export const PlayerSettingsSeekAction = () => {
	const app = useAppManager()
	const seekActions = useConfigOrDefault(
		app.configManager.globalPlayerConfig
	).seekActions
	const updater = useConfigUpdater(app.configManager.globalPlayerConfig)
	return (
		<Container>
			<h3>Seek</h3>

			<Section>
				<h4>Short button</h4>
				<PlayerSeekActionPicker
					value={seekActions.short}
					defaultSeekTimeMillis={10000}
					onChange={(v) => {
						updater.updateConfig((draft) => {
							draft.seekActions.short = v
						})
					}}
				/>
			</Section>
			<Section>
				<h4>Long button</h4>
				<PlayerSeekActionPicker
					value={seekActions.long}
					defaultSeekTimeMillis={60000}
					onChange={(v) => {
						updater.updateConfig((draft) => {
							draft.seekActions.long = v
						})
					}}
				/>
			</Section>
			<Section>
				<h4>External devices</h4>
				<PlayerSeekActionPicker
					value={seekActions.mediaSession}
					defaultSeekTimeMillis={10000}
					onChange={(v) => {
						updater.updateConfig((draft) => {
							draft.seekActions.mediaSession = v
						})
					}}
				/>
			</Section>
		</Container>
	)
}

import { PlayerSeekActionPicker } from "@app/components/player/settings/playerSeekActionPicker"
import { INIT_GLOBAL_PLAYER_CONFIG } from "@app/domain/defines/config/config"
import { useAppManager } from "@app/domain/managers/app"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	gap: 0.4em;
`

const Section = styled.div``

export const PlayerSettingsSeekAction = () => {
	const app = useAppManager()
	const seekActions =
		useStickySubscribable(app.configManager.globalPlayerConfig.bus)
			?.seekActions || INIT_GLOBAL_PLAYER_CONFIG.seekActions
	return (
		<Container>
			<h3>Seek</h3>

			<Section>
				<h4>Short button</h4>
				<PlayerSeekActionPicker
					value={seekActions.short}
					defaultSeekTimeMillis={10000}
					onChange={(v) => {
						app.configManager.globalPlayerConfig.update((draft) => {
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
						app.configManager.globalPlayerConfig.update((draft) => {
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
						app.configManager.globalPlayerConfig.update((draft) => {
							draft.seekActions.mediaSession = v
						})
					}}
				/>
			</Section>
		</Container>
	)
}

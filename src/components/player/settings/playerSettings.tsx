import { PlayerSettingsSeekAction } from "@app/components/player/settings/element/playerSettingsSeek"
import { PlayerSettingsSleepSection } from "@app/components/player/settings/element/playerSettingsSleep"
import { PlayerSettingsSpeedSection } from "@app/components/player/settings/element/playerSettingsSpeed"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;

	height: 100%;

	gap: 2em;
`

export const PlayerSettings = () => {
	return (
		<Container>
			<PlayerSettingsSpeedSection />
			<hr />
			<PlayerSettingsSleepSection />
			<hr />
			<PlayerSettingsSeekAction />
		</Container>
	)
}

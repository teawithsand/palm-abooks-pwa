
import { PlayerSettingsSpeedSection } from "@app/components/player/settings/element/playerSettingsSpeed"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;

	height: 100%;
    
    gap: 1em;
`

export const PlayerSettings = () => {
	return (
		<Container>
            <PlayerSettingsSpeedSection />
		</Container>
	)
}

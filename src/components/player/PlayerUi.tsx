import { PlayerControlsBar } from "@app/components/player/element/PlayerControlsBar"
import { PlayerCoverDisplay } from "@app/components/player/element/PlayerCoverDisplay"
import { PlayerFileInfoDisplay } from "@app/components/player/element/PlayerFileInfoDisplay"
import { PlayerGlobalProgressBar } from "@app/components/player/element/PlayerGlobalProgressBar"
import { PlayerGlobalProgressDisplay } from "@app/components/player/element/PlayerGlobalProgressDisplay"
import { PlayerLocalProgressBar } from "@app/components/player/element/PlayerLocalProgressBar"
import { PlayerLocalProgressDisplay } from "@app/components/player/element/PlayerLocalProgressDisplay"
import { PlayerOptionsBar } from "@app/components/player/element/PlayerOptionsBar"
import { PlayerSleepBar } from "@app/components/player/element/PlayerSleepBar"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;

	height: 100%;
`

export const PlayerMusicUi = () => {
	return (
		<Container>
			<PlayerOptionsBar />
			<PlayerSleepBar />
			<PlayerCoverDisplay />
			<PlayerFileInfoDisplay />
			<PlayerLocalProgressBar />
			<PlayerLocalProgressDisplay />
			<PlayerGlobalProgressBar />
			<PlayerGlobalProgressDisplay />
			<PlayerControlsBar />
		</Container>
	)
}

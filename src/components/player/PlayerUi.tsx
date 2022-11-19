import { PlayerControlsBar } from "@app/components/player/element/PlayerControlsBar"
import { PlayerCoverDisplay } from "@app/components/player/element/PlayerCoverDisplay"
import { PlayerFileInfoDisplay } from "@app/components/player/element/PlayerFileInfoDisplay"
import { PlayerGlobalProgressBar } from "@app/components/player/element/PlayerGlobalProgressBar"
import { PlayerGlobalProgressDisplay } from "@app/components/player/element/PlayerGlobalProgressDisplay"
import { PlayerLocalProgressBar } from "@app/components/player/element/PlayerLocalProgressBar"
import { PlayerLocalProgressDisplay } from "@app/components/player/element/PlayerLocalProgressDisplay"
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

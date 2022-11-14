import { PlayerControlsBar } from "@app/components/player/element/PlayerControlsBar"
import { PlayerEntriesList } from "@app/components/player/element/PlayerEntriesList"
import { PlayerGlobalProgressBar } from "@app/components/player/element/PlayerGlobalProgressBar"
import { PlayerGlobalProgressDisplay } from "@app/components/player/element/PlayerGlobalProgressDisplay"
import { PlayerLocalProgressBar } from "@app/components/player/element/PlayerLocalProgressBar"
import { PlayerLocalProgressDisplay } from "@app/components/player/element/PlayerLocalProgressDisplay"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
`

export const PlayerMusicUi = () => {
	return (
		<Container>
			<PlayerEntriesList />
			<PlayerLocalProgressBar />
			<PlayerLocalProgressDisplay />
			<PlayerGlobalProgressBar />
			<PlayerGlobalProgressDisplay />
			<PlayerControlsBar />
		</Container>
	)
}

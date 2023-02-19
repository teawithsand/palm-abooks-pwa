import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import React from "react"
import styled from "styled-components"

import FastForward from "@app/components/player/icons/fast-forward.svg"
import InnerPause from "@app/components/player/icons/pause.svg"
import InnerPlay from "@app/components/player/icons/play.svg"
import Skip from "@app/components/player/icons/skip.svg"

import { useAppPaths } from "@app/paths"
import { LinkContainer } from "@app/util/LinkContainer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import { Button } from "react-bootstrap"
import { SleepManagerStateType } from "@app/domain/managers/newPlayer/sleep/sleepManager"

const Play = styled(InnerPlay)``

const Pause = styled(InnerPause)``

const Prev = styled(Skip)`
	rotate: 180deg;
`

const Rewind = styled(FastForward)`
	rotate: 180deg;
`

const Bar = styled.div`
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: 1fr;

	gap: 1em;

	overflow: hidden;
	width: 100%;

	justify-items: stretch;
`

export const PlayerOptionsBar = () => {
	const uiData = useUiPlayerData()
	const app = useAppManager()
	const actions = app.playerActionsManager
	const sleepState = useStickySubscribable(app.sleepManager.bus)

	const { playerOptionsPath, playerPlaylistPath } = useAppPaths()

	return (
		<Bar>
			<LinkContainer to={playerOptionsPath}>
				<Button href="#" variant="success">
					Player options
				</Button>
			</LinkContainer>
			<LinkContainer to={playerPlaylistPath}>
				<Button href="#">Playlist</Button>
			</LinkContainer>
			<Button
				variant="secondary"
				onClick={() => {
					if (sleepState.type === SleepManagerStateType.DISABLED) {
						actions.setSleepFromConfig()
					} else {
						actions.unsetSleep()
					}
				}}
			>
				Toggle sleep
			</Button>
		</Bar>
	)
}

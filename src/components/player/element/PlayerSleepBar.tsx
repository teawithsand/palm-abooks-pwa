import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import React from "react"
import styled from "styled-components"

import FastForward from "@app/components/player/icons/fast-forward.svg"
import InnerPause from "@app/components/player/icons/pause.svg"
import InnerPlay from "@app/components/player/icons/play.svg"
import Skip from "@app/components/player/icons/skip.svg"

import { breakpointMediaDown, BREAKPOINT_MD } from "@teawithsand/tws-stl-react"
import { Button } from "react-bootstrap"

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

	justify-items: center;
`

export const PlayerSleepBar = () => {
	const uiData = useUiPlayerData()
	const actions = useAppManager().playerActionsManager
	
	return (
		<Bar>
			
		</Bar>
	)
}

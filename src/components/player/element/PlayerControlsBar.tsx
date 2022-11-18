import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import React from "react"
import styled from "styled-components"

import FastForward from "@app/components/player/icons/fast-forward.svg"
import InnerPause from "@app/components/player/icons/pause.svg"
import InnerPlay from "@app/components/player/icons/play.svg"
import Skip from "@app/components/player/icons/skip.svg"

import { breakpointMediaDown, BREAKPOINT_MD } from "@teawithsand/tws-stl-react"

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

	& > svg {
		// TODO(teawithsand): ensure nice display on mobile devices
		cursor: pointer;

		height: 100%;
		min-height: 50px;
		max-height: 10vh;

		@media ${breakpointMediaDown(BREAKPOINT_MD)} {
			max-height: 20vh;
		}

		* {
			transition: fill 0.5s ease;
			fill: black;
		}
	}
`

export const PlayerControlsBar = () => {
	const uiData = useUiPlayerData()
	const actions = useAppManager().playerActionsManager

	const onPrev = () => actions.prevFile()
	const onRewind = () => actions.jumpBackward()
	const onTogglePlayPause = () => actions.togglePlay()
	const onFastForward = () => actions.jumpForward()
	const onSkip = () => actions.nextFile()

	return (
		<Bar>
			<Prev onClick={onPrev} />
			<Rewind onClick={onRewind} />
			{uiData?.isPlaying ?? false ? (
				<Pause onClick={onTogglePlayPause} />
			) : (
				<Play onClick={onTogglePlayPause} />
			)}
			<FastForward onClick={onFastForward} />
			<Skip onClick={onSkip} />
		</Bar>
	)
}

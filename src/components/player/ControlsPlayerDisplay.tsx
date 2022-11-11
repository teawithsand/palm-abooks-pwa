import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { WhatToPlayData } from "@app/domain/managers/whatToPlayManager"
import React from "react"

export type ControlsPlayerDisplayData = {
	whatToPlayData: WhatToPlayData
	entry: PlayableEntry

	isPlaying: boolean
	position: number | null
	duration: number | null
}

export type ControlsPlayerDisplayCallbacks = {
	togglePlay?: (toIsPlaying: boolean) => void
}

export const ControlsPlayerDisplay = (
	props: ControlsPlayerDisplayData & ControlsPlayerDisplayCallbacks
) => {
	return <>{JSON.stringify(props)}</>
}

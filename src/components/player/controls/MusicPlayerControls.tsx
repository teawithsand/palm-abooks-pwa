import {
	ControlsPlayerDisplayCallbacks,
	ControlsPlayerDisplayData,
} from "@app/components/player/controls/types"
import React from "react"

export const MusicPlayerControls = (
	props: ControlsPlayerDisplayData & ControlsPlayerDisplayCallbacks
) => {
	return <>{JSON.stringify(props)}</>
}

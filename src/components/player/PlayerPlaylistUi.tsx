import { PlayerEntriesList } from "@app/components/player/element/PlayerEntriesList"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
`

export const PlayerPlaylistUi = () => {
	const actions = useAppManager().playerActionsManager

    return (
		<Container>
			<PlayerEntriesList
				onEntryClick={(id) => {
					actions.jump(id)
				}}
			/>
		</Container>
	)
}

import { PlayerEntryListMetadataType } from "@app/domain/managers/newPlayer/list/metadata"
import { useUiPlayerData } from "@app/domain/ui/player"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import React from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	align-items: center;
	justify-items: center;
	overflow: hidden;
	text-align: center;

	word-break: break-word;

	font-size: 1.2em;
	cursor: pointer;
`

export const PlayerFileInfoDisplay = () => {
	const ui = useUiPlayerData()
	const navigate = useNavigate()
	const { playerPlaylistPath } = useAppPaths()

	let name = ui?.lastValidPosition.entry?.displayName ?? ""

	let content = ""
	if (!ui || ui.entriesBag.length === 0) {
		content = "Nothing to play"
	} else {
		if (ui.metadata.data.type === PlayerEntryListMetadataType.ABOOK) {
			content = `Now playing: ${ui.metadata.data.abook.displayName}/${name}`
		} else {
			content = "Playing audio"
		}
	}

	return (
		<Container
			onClick={() => {
				navigate(playerPlaylistPath)
			}}
		>
			{content}
		</Container>
	)
}

import { PlayableEntryType } from "@app/domain/defines/player/playableEntry"
import { WhatToPlayDataType } from "@app/domain/defines/whatToPlay/data"
import { useUiPlayerData } from "@app/domain/ui/player"
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
`

export const PlayerFileInfoDisplay = () => {
	const ui = useUiPlayerData()

	let name = ""
	const entry = ui?.currentPosition.entry
	if (entry) {
		if (entry.type === PlayableEntryType.FILE_ENTRY) {
			name = entry.entry.metadata.name
		} else if (
			entry.type === PlayableEntryType.ARBITRARY_BLOB &&
			entry.blob instanceof File
		) {
			name = entry.blob.name
		} else if (entry.type === PlayableEntryType.ARBITRARY_URL) {
			name = entry.url
		}
	}

	let content = ""
	if (
		!ui ||
		!ui.whatToPlayData ||
		ui.whatToPlayData.entriesBag.length === 0
	) {
		content = "Nothing to play"
	} else {
		if (ui.whatToPlayData.type === WhatToPlayDataType.ABOOK) {
			content = `Now playing: ${ui.whatToPlayData.abook.metadata.title}/${name}`
		} else {
			content = ""
		}
	}

	return <Container>{content}</Container>
}

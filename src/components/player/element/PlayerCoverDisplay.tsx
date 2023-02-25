import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import styled from "styled-components"
import React, { useMemo } from "react"
import { DEFAULT_IMAGE_COVER_URL } from "@app/domain/ui/abook"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import { useFileEntryEntityUrl } from "@app/domain/defines/entity/fileEntryHook"
import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import { usePlayerSourceUrl } from "@app/domain/defines/player/playerSourceHook"

const Container = styled.div`
	display: grid;
	align-items: center;
	justify-items: center;
	overflow: hidden;

	> img {
		height: 100%;
		width: 100%;
		object-fit: contain;
	}
`

export const PlayerCoverDisplay = () => {
	const app = useAppManager()
	const fullList = useStickySubscribableSelector(
		app.playerManager.bus,
		(state) => state.playerEntryListManagerState.states.full.entriesBag
	)
	const entry = useMemo(() => {
		return fullList.findFirstEntryWithDisposition(
			FileEntryDisposition.IMAGE
		)
	}, [fullList])

	const coverUrl = usePlayerSourceUrl(entry?.source ?? null)

	return (
		<Container>
			<img src={coverUrl ?? DEFAULT_IMAGE_COVER_URL} />
		</Container>
	)
}

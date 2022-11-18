import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import styled from "styled-components"
import React from "react"

const defaultCoverUrl = "http://placekitten.com/300/300"

const Container = styled.div`
	display: grid;
	align-items: center;
	justify-items: center;
    overflow: hidden;

    > img {
        height: 100%;
        width: 100%;
        object-fit: cover;
    }
`

export const PlayerCoverDisplay = () => {
	const ui = useUiPlayerData()

    // TODO(teawithsand): implement this

	return (
		<Container>
			<img src={defaultCoverUrl} />
		</Container>
	)
}

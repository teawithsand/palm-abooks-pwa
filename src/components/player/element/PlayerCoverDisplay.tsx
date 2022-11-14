import { useAppManager } from "@app/domain/managers/app"
import { useUiPlayerData } from "@app/domain/ui/player"
import styled from "styled-components"

const defaultCoverUrl = "http://placekitten.com/300/300"

const Container = styled.div``

export const PlayerCoverDisplay = () => {
    const ui = useUiPlayerData()

}
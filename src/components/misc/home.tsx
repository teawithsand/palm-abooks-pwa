import { LastPlayedSourceType } from "@app/domain/defines/config/state"
import { useAppManager } from "@app/domain/managers/app"
import { useQueryAbookById } from "@app/domain/storage/queries/abook"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import { useConfig } from "@teawithsand/tws-config"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import { Link } from "gatsby"
import React from "react"
import { Alert, Button } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div``

export const Home = () => {
	const app = useAppManager()
	const navigate = useNavigate()
	const isPlayerSet = useStickySubscribableSelector(
		app.playerManager.bus,
		(state) =>
			state.playerEntryListManagerState.listState.entriesBag.length > 0
	)

	const config = useConfig(app.configManager.globalPersistentPlayerState)
	const lastPlayedAbook = useQueryAbookById(
		config.lastPlayed?.type === LastPlayedSourceType.ABOOK_ID
			? config.lastPlayed.id
			: ""
	)

	const { playerUiPath } = useAppPaths()

	return (
		<Container>
			{isPlayerSet ? (
				<Alert variant="info">
					Player is now playing.{" "}
					<Link to={playerUiPath}>Go to player UI.</Link>
				</Alert>
			) : lastPlayedAbook ? (
				<Alert variant="info">
					You've last played "{lastPlayedAbook.displayName}".
					<a
						onClick={(e) => {
							e.preventDefault()

							app.playerActionsManager.playAbook(lastPlayedAbook)
							navigate(playerUiPath)
						}}
						href="#"
					>
						Click here to resume playback
					</a>
				</Alert>
			) : null}
			<h3>Welcome to PalmABooks PWA!</h3>
			<p>
				PalmABooks PWA is ABook player, with features like sleep,
				jumping back after pause and so on.
			</p>
			<p>
				Use menu in right top corner to add ABooks or play existing
				ones.
			</p>
		</Container>
	)
}

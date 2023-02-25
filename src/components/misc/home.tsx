import { PwaInstallBanner } from "@app/components/misc/pwaInstallBanner"
import { LastPlayedSourceType } from "@app/domain/defines/config/state"
import { useAppManager } from "@app/domain/managers/app"
import { useQueryAbookById } from "@app/domain/storage/queries/abook"
import { useAppPaths } from "@app/paths"
import { LinkContainer } from "@app/util/LinkContainer"
import { useNavigate } from "@app/util/navigate"
import { useConfig } from "@teawithsand/tws-config"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import { Link } from "gatsby"
import React from "react"
import { Alert, Button } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	font-size: 1.2em;
`

const ButtonsGrid = styled.div`
	display: flex;
	flex-flow: row wrap;
	gap: 1em;
	& > * {
		flex-basis: calc(50% - 1em);
		flex-shrink: 0;
		flex-grow: 1;
	}
`

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

	const {
		playerUiPath,
		storageInfoPath,
		abookListPath,
		abookAddLocalPath,
		playerPlayLocal,
		receiveFilesPath,
		sendFilesPath,
	} = useAppPaths()
	const isStoragePersistent = useStickySubscribable(
		app.storageSizeManager.storageStatsBus
	).isPersistent

	return (
		<Container>
			<PwaInstallBanner />
			{!isStoragePersistent ? (
				<Alert
					variant="warning"
					onClick={() => {
						navigate(storageInfoPath)
					}}
					style={{
						cursor: "pointer",
					}}
				>
					Your storage is not persistent. Click this alert for more
					info.
				</Alert>
			) : null}
			{isPlayerSet ? (
				<Alert variant="info">
					Player is now playing.{" "}
					<Link to={playerUiPath}>Go to player UI.</Link>
				</Alert>
			) : lastPlayedAbook ? (
				<Alert
					variant="info"
					onClick={() => {
						app.playerActionsManager.playAbook(lastPlayedAbook)
						navigate(playerUiPath)
					}}
					style={{
						cursor: "pointer",
					}}
				>
					Last time you've been listening to{" "}
					<b>{lastPlayedAbook.displayName}</b>{" "}
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault()
						}}
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
				Use menu in right top corner to add ABooks or play added ones.
				You may also use receive/send features to receive/send abook
				from your pc to your mobile device.
			</p>
			<p>
				Complete guide how to use this app is NIY, especially that it's
				in it's public alpha phase.
			</p>
			<p>
				Here are some most common things that you may be interested in:
			</p>
			<ButtonsGrid>
				<LinkContainer to={abookListPath}>
					<Button href="#">ABook list</Button>
				</LinkContainer>
				<LinkContainer to={abookAddLocalPath}>
					<Button href="#">Add ABook</Button>
				</LinkContainer>
				<LinkContainer to={receiveFilesPath}>
					<Button href="#">Receive ABook</Button>
				</LinkContainer>
				<LinkContainer to={sendFilesPath}>
					<Button href="#">Send ABook</Button>
				</LinkContainer>
				<LinkContainer to={playerPlayLocal}>
					<Button href="#">Play files from local device</Button>
				</LinkContainer>
			</ButtonsGrid>
		</Container>
	)
}

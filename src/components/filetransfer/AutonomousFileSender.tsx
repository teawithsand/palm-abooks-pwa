import { PeerManager } from "@app/components/filetransfer/PeerManager"
import { QRAuthCodeSender } from "@app/components/filetransfer/exchange/QRAuthCodeSender"
import { SenderConnOpener } from "@app/components/filetransfer/sender/SenderConnOpener"
import { SenderConnRegistrySpy } from "@app/components/filetransfer/sender/SenderConnRegistrySpy"
import { SenderEntriesPicker } from "@app/components/filetransfer/sender/SenderEntriesPicker"
import {
	FileTransferEntry,
	FileTransferStateManager,
	FileTransferStateManagerContext,
	SenderStateManager,
	SenderStateManagerContext,
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React, { useEffect, useMemo } from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: auto;
	gap: 1em;
`

const Section = styled.div``

const SectionTitle = styled.h3``

const SectionBody = styled.div``

// TODO(teawithsand): clear conn registry on entries or auth code or peer id change
//  can do it with hack

const InnerFileSender = () => {
	const transferManager = useFileTransferStateManager()
	const senderManager = useSenderStateManager()
	const authSecret = useStickySubscribable(transferManager.authSecretBus)
	const peerState = useStickySubscribable(transferManager.peer.stateBus)

	return (
		<Container>
			<Section>
				<SectionTitle>1. Pick files to send</SectionTitle>
				<SectionBody>
					<SenderEntriesPicker />
				</SectionBody>
			</Section>
			<Section>
				<SectionTitle>2. Enable communication</SectionTitle>
				<SectionBody>
					<PeerManager />
				</SectionBody>
			</Section>
			<Section>
				<SectionTitle>
					3. Scan OR show code to make connection
				</SectionTitle>
				<SectionBody>
					<SenderConnOpener />
				</SectionBody>
			</Section>
			<Section>
				<SectionTitle>
					4. Accept connections to perform file transfers
				</SectionTitle>
				<SectionBody>
					<SenderConnRegistrySpy registry={senderManager.registry} />
				</SectionBody>
			</Section>
		</Container>
	)
}

export const AutonomousFileSender = (props: {
	entries?: FileTransferEntry[] | null | undefined
}) => {
	const { entries } = props
	const fileTransferStateManager = useMemo(
		() => new FileTransferStateManager(new PeerJSIPeer()),
		[]
	)
	const senderStateManager = useMemo(
		() => new SenderStateManager(fileTransferStateManager),
		[fileTransferStateManager]
	)

	useEffect(() => {
		fileTransferStateManager.peer.setConfig({
			acceptDataConnections: true,
			acceptMediaConnections: false,
		})
	}, [fileTransferStateManager])


	useEffect(() => {
		return () => {
			senderStateManager.close()
		}
	}, [senderStateManager])

	useEffect(() => {
		return () => {
			fileTransferStateManager.close()
		}
	}, [fileTransferStateManager])

	useEffect(() => {
		if (entries) senderStateManager.setEntries(entries)
	}, [entries, senderStateManager])

	return (
		<SenderStateManagerContext.Provider value={senderStateManager}>
			<FileTransferStateManagerContext.Provider
				value={fileTransferStateManager}
			>
				<InnerFileSender />
			</FileTransferStateManagerContext.Provider>
		</SenderStateManagerContext.Provider>
	)
}

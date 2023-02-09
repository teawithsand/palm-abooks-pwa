import { PeerManager } from "@app/components/filetransfer/PeerManager"
import { SenderConnOpener } from "@app/components/filetransfer/sender/SenderConnOpener"
import { SenderConnRegistrySpy } from "@app/components/filetransfer/sender/SenderConnRegistrySpy"
import { SenderContextProvider } from "@app/components/filetransfer/sender/SenderContextProvider"
import { SenderEntriesPicker } from "@app/components/filetransfer/sender/SenderEntriesPicker"
import {
	FileTransferEntry,
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"
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
	const authSecret = useStickySubscribable(transferManager.stateBus)
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
	return (
		<SenderContextProvider entries={entries ?? undefined}>
			<InnerFileSender />
		</SenderContextProvider>
	)
}

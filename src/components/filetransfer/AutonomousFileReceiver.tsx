import { PeerManager } from "@app/components/filetransfer/PeerManager"
import { ReceiverConnOpener } from "@app/components/filetransfer/receiver/ReceiverConnOpener"
import { ReceiverConnRegistrySpy } from "@app/components/filetransfer/receiver/ReceiverConnRegistrySpy"
import { ReceiverContextProvider } from "@app/components/filetransfer/receiver/ReceiverContextProvider"
import {
	useFileTransferStateManager,
	useReceiverStateManager,
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

const InnerFileReceiver = () => {
	const transferManager = useFileTransferStateManager()
	const receiverManager = useReceiverStateManager()
	const authSecret = useStickySubscribable(transferManager.stateBus)
	const peerState = useStickySubscribable(transferManager.peer.stateBus)

	return (
		<Container>
			<Section>
				<SectionTitle>1. Enable communication</SectionTitle>
				<SectionBody>
					<PeerManager />
				</SectionBody>
			</Section>
			<Section>
				<SectionTitle>
					2. Scan OR show code to make connection
				</SectionTitle>
				<SectionBody>
					<ReceiverConnOpener />
				</SectionBody>
			</Section>
			<Section>
				<SectionTitle>
					3. Accept connections to perform file transfers
				</SectionTitle>
				<SectionBody>
					<ReceiverConnRegistrySpy
						registry={receiverManager.registry}
					/>
				</SectionBody>
			</Section>
		</Container>
	)
}

export const AutonomousFileReceiver = () => {
	return (
		<ReceiverContextProvider>
			<InnerFileReceiver />
		</ReceiverContextProvider>
	)
}

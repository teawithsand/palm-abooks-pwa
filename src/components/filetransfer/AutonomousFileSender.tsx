import { SenderConnRegistrySpy } from "@app/components/filetransfer/sender/SenderConnRegistrySpy"
import { SenderContextProvider } from "@app/components/filetransfer/sender/SenderContextProvider"
import { SenderEntriesPicker } from "@app/components/filetransfer/sender/SenderEntriesPicker"
import { SenderStateController } from "@app/components/filetransfer/sender/SenderStateController"
import {
	FileTransferData,
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
				<SectionTitle>Pick files to send</SectionTitle>
				<SectionBody>
					<SenderEntriesPicker />
				</SectionBody>
			</Section>
			<hr />
			<SenderStateController />
			<Section>
				<SectionTitle>
					Accept connections to perform file transfers
				</SectionTitle>
				<SectionBody>
					<SenderConnRegistrySpy registry={senderManager.registry} />
				</SectionBody>
			</Section>
		</Container>
	)
}

export const AutonomousFileSender = (props: {
	entries?: FileTransferData | null | undefined
}) => {
	const { entries } = props
	return (
		<SenderContextProvider data={entries ?? undefined}>
			<InnerFileSender />
		</SenderContextProvider>
	)
}

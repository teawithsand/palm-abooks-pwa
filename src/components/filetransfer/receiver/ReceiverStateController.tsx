import styled from "styled-components"
import React, { CSSProperties } from "react"
import { PeerManager } from "@app/components/filetransfer/PeerManager"
import { ReceiverConnOpener } from "@app/components/filetransfer/receiver/ReceiverConnOpener"

const Section = styled.div``

const SectionTitle = styled.h3``

const SectionBody = styled.div``

const Container = styled.div`
	display: grid;
	gap: 1em;
`

export const ReceiverStateController = (props: {
	style?: CSSProperties
	className?: string
}) => {
	return (
		<Container {...props}>
			<Section>
				<SectionTitle>Communications</SectionTitle>
				<SectionBody>
					<PeerManager />
				</SectionBody>
			</Section>
			<Section>
				<SectionBody>
					<ReceiverConnOpener />
				</SectionBody>
			</Section>
		</Container>
	)
}

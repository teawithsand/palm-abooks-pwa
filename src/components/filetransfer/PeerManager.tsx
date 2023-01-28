import { useFileTransferStateManager } from "@app/domain/filetransfer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"
import { Button } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div``

export const PeerManager = () => {
	const contextHelper = useFileTransferStateManager()
	const peerHelperState = useStickySubscribable(
		contextHelper.peerHelper.stateBus
	)

	return (
		<Container>
			<div>
				<ul>
					<li>
						Peer state:{" "}
						{peerHelperState.peer ? "Active" : "Inactive"}
					</li>
					<li>Error: {peerHelperState.peerState.error?.message}</li>
					<li>Is closed: {peerHelperState.peerState.isClosed}</li>
				</ul>
			</div>
			<div>
				<Button
					onClick={() => {
						contextHelper.regenerateAuthSecret()
						contextHelper.peerHelper.setConfig({
							config: null,
							id: null,
						})
					}}
				>
					(Re)start peer
				</Button>
				<Button
					onClick={() => {
						contextHelper.peerHelper.setConfig(null)
					}}
				>
					Stop peer
				</Button>
			</div>
		</Container>
	)
}

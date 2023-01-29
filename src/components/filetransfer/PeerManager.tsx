import { useFileTransferStateManager } from "@app/domain/filetransfer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"
import { Button } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div``

export const PeerManager = () => {
	const contextHelper = useFileTransferStateManager()
	const peerHelperState = useStickySubscribable(contextHelper.peer.stateBus)

	return (
		<Container>
			<div>
				<ul>
					<li>
						Peer state:{" "}
						{peerHelperState.isActive ? "Active" : "Inactive"}
					</li>
					<li>
						Error: {peerHelperState.error?.message ?? "No error"}
					</li>
					<li>Is closed: {peerHelperState.isClosed ? "T" : "F"}</li>
				</ul>
			</div>
			<div>
				<Button
					onClick={() => {
						contextHelper.regenerateAuthSecret()
						contextHelper.peer.setPeerJsConfig({})
					}}
				>
					(Re)start peer
				</Button>
				<Button
					onClick={() => {
						contextHelper.peer.setPeerJsConfig(null)
					}}
				>
					Stop peer
				</Button>
			</div>
		</Container>
	)
}

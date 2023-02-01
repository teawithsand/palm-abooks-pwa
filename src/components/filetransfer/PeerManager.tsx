import {
	isFileTransferAuthNameValid,
	useFileTransferStateManager,
} from "@app/domain/filetransfer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React, { useEffect, useState } from "react"
import { Button, Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div``

export const PeerManager = () => {
	const contextHelper = useFileTransferStateManager()
	const peerHelperState = useStickySubscribable(contextHelper.peer.stateBus)

	const fileTransferStateManager = useFileTransferStateManager()
	const name = useStickySubscribableSelector(
		fileTransferStateManager.stateBus,
		(state) => state.name
	)

	const [innerName, setInnerName] = useState("")

	useEffect(() => {
		setInnerName(name)
	}, [name, setInnerName])

	const setName = (name: string) => {
		setInnerName(name)
		if (!isFileTransferAuthNameValid(name)) return

		fileTransferStateManager.setName(name)
	}

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
				<Form.Group>
					<Form.Control
						disabled={peerHelperState.isActive}
						type="text"
						value={innerName}
						onChange={(e) => {
							setName(e.target.value)
						}}
						isInvalid={!isFileTransferAuthNameValid(innerName)}
					/>
				</Form.Group>
			</div>
			<div>
				<Button
					disabled={!isFileTransferAuthNameValid(innerName)}
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

import {
	isFileTransferAuthNameValid,
	useFileTransferStateManager,
} from "@app/domain/filetransfer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React, { useEffect, useState } from "react"
import { Alert, Button, ButtonGroup, Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 0.5em;
`

const StateDisplay = () => {
	const contextHelper = useFileTransferStateManager()
	const peerHelperState = useStickySubscribable(contextHelper.peer.stateBus)

	if (!peerHelperState.isActive || peerHelperState.isClosed) {
		return <Alert variant="info">Connectivity disabled</Alert>
	} else if (peerHelperState.error) {
		return <Alert variant="error">An error occurred</Alert> // TODO(teawithsand): run error explainer here
	} else if (!peerHelperState.isReady) {
		return <Alert variant="info">Initializing...</Alert>
	} else {
		return <Alert variant="success">Connectivity ready!</Alert>
	}
}

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
			<StateDisplay />
			<Form.Group className="mb-2">
				<Form.Label>Client's name</Form.Label>
				<Form.Control
					disabled={peerHelperState.isActive}
					type="text"
					value={innerName}
					onChange={(e) => {
						const value = e.target.value
						setName(value)
					}}
					isInvalid={!isFileTransferAuthNameValid(innerName)}
				/>
			</Form.Group>

			<ButtonGroup>
				<Button
					className="w-100"
					disabled={!isFileTransferAuthNameValid(innerName)}
					onClick={() => {
						contextHelper.regenerateAuthSecret()
						contextHelper.peer.setPeerJsConfig({})
					}}
				>
					{peerHelperState.isActive
						? "Reset"
						: "Initialize(requires internet connection)"}
				</Button>
				{peerHelperState.isActive ? (
					<Button
						className="w-100"
						variant="danger"
						onClick={() => {
							contextHelper.peer.setPeerJsConfig(null)
						}}
					>
						Disable
					</Button>
				) : null}
			</ButtonGroup>
		</Container>
	)
}

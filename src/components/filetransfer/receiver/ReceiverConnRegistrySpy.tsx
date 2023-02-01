import {
	FileTransferConn,
	ReceiverAdapterConnConfig,
	ReceiverAdapterConnStage,
	ReceiverAdapterConnState,
	ReceiverAdapterConnStatus,
	ReceiverAdapterInitData,
} from "@app/domain/filetransfer"
import { ConnRegistry } from "@teawithsand/tws-peer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React from "react"
import { Button, ButtonGroup, ProgressBar } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
	grid-template-columns: auto;
`

export const ReceiverConnRegistrySpy = (props: {
	registry: ConnRegistry<
		FileTransferConn,
		ReceiverAdapterConnState,
		ReceiverAdapterConnConfig,
		ReceiverAdapterInitData
	>
}) => {
	const { registry } = props
	const state = useStickySubscribable(registry.stateBus)
	const keys = useStickySubscribableSelector(registry.stateBus, (state) =>
		Object.entries(state)
			.filter(
				([_k, v]) =>
					true ||
					v.state.status !== ReceiverAdapterConnStatus.CONNECTED
			)
			.map(([k, _v]) => k)
	)

	return (
		<Container>
			{!keys.length
				? "No connections so far"
				: keys.map((k) => (
						<ReceiverConnSpy key={k} id={k} registry={registry} />
				  ))}
		</Container>
	)
}

const EntryHeader = styled.h4`
	padding: 0;
	margin: 0;
	font-size: 1.25em;
`

const Entry = styled.div`
	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 0.25em;
	padding: 0.5em;

	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

const ReceiverConnSpy = (props: {
	registry: ConnRegistry<
		FileTransferConn,
		ReceiverAdapterConnState,
		ReceiverAdapterConnConfig,
		ReceiverAdapterInitData
	>
	id: string
}) => {
	const { registry, id } = props
	const state = useStickySubscribable(registry.stateBus)[id]

	if (!state) {
		return <Entry>Connection with id "{id}" was not found.</Entry>
	}

	const {
		isClosed,
		initData: { auth },
		state: { status, totalDoneFraction, headers, authResult },
		config: { stage },
		error,
	} = state

	let statusString = ""

	if (error) {
		statusString = "Error"
	} else if (status === ReceiverAdapterConnStatus.CONNECTED) {
		statusString = "Connected"
	} else if (status === ReceiverAdapterConnStatus.AUTHENTICATED) {
		statusString = "Authenticated"
	} else if (status === ReceiverAdapterConnStatus.RECEIVED_HEADERS) {
		statusString = "Received offers"
	} else if (status === ReceiverAdapterConnStatus.RECEIVING_FILES) {
		statusString = "Pending... Please wait."
	} else if (status === ReceiverAdapterConnStatus.DONE) {
		statusString = "Done"
	}

	let buttons = null

	if (isClosed || status === ReceiverAdapterConnStatus.DONE) {
		buttons = (
			<Button
				variant="danger"
				onClick={() => {
					registry.setConfig(id, {
						stage: ReceiverAdapterConnStage.CLOSE,
					})
					registry.removeConn(id)
				}}
			>
				Remove
			</Button>
		)
	} else if (status === ReceiverAdapterConnStatus.RECEIVED_HEADERS) {
		buttons = (
			<ButtonGroup>
				<Button
					variant="success"
					onClick={() => {
						registry.setConfig(id, {
							stage: ReceiverAdapterConnStage.RECEIVE_FILES,
						})
					}}
				>
					Accept
				</Button>
				<Button
					variant="danger"
					onClick={() => {
						registry.setConfig(id, {
							stage: ReceiverAdapterConnStage.CLOSE,
						})
						registry.removeConn(id)
					}}
				>
					Deny
				</Button>
			</ButtonGroup>
		)
	} else if (status === ReceiverAdapterConnStatus.RECEIVING_FILES) {
		buttons = (
			<Button
				variant="danger"
				onClick={() => {
					registry.setConfig(id, {
						stage: ReceiverAdapterConnStage.CLOSE,
					})
					registry.removeConn(id)
				}}
			>
				Stop
			</Button>
		)
	} else if (status === ReceiverAdapterConnStatus.AUTHENTICATED) {
		buttons = (
			<Button
				variant="danger"
				onClick={() => {
					registry.setConfig(id, {
						stage: ReceiverAdapterConnStage.CLOSE,
					})
					registry.removeConn(id)
				}}
			>
				Close
			</Button>
		)
	}

	return (
		<Entry>
			<EntryHeader>Status: {statusString}</EntryHeader>
			{authResult ? (
				<div>Connection from: {authResult.remotePartyName}</div>
			) : null}
			<div>
				<ProgressBar
					now={Math.round(totalDoneFraction * 100 * 10) / 10}
				/>
			</div>
			<ButtonGroup>{buttons}</ButtonGroup>
		</Entry>
	)
}

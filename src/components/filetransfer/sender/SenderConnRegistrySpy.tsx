import {
	FileTransferConn,
	SenderAdapterConnStage,
	SenderAdapterConnState,
	SenderAdapterConnStatus,
	SenderAdapterInitData,
	SenderConnConfig,
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

export const SenderConnRegistrySpy = (props: {
	registry: ConnRegistry<
		FileTransferConn,
		SenderAdapterConnState,
		SenderConnConfig,
		SenderAdapterInitData
	>
}) => {
	const { registry } = props
	const keys = useStickySubscribableSelector(registry.stateBus, (state) =>
		Object.entries(state)
			.filter(
				([_k, v]) =>
					true || v.state.status !== SenderAdapterConnStatus.CONNECTED
			)
			.map(([k, _v]) => k)
	)

	return (
		<Container>
			{!keys.length
				? "No connections so far"
				: keys.map((k) => (
						<SenderConnSpy key={k} id={k} registry={registry} />
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

const SenderConnSpy = (props: {
	registry: ConnRegistry<
		FileTransferConn,
		SenderAdapterConnState,
		SenderConnConfig,
		SenderAdapterInitData
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
		initData: { auth, entries },
		state: { status, totalFraction, authResult },
		config: { stage },
		error,
	} = state

	let statusString = ""

	if (error) {
		statusString = "Error"
	} else if (status === SenderAdapterConnStatus.CONNECTED) {
		statusString = "Connected"
	} else if (status === SenderAdapterConnStatus.AUTHENTICATED_HEADERS_SENT) {
		statusString = "Authenticated"
	} else if (status === SenderAdapterConnStatus.SENDING_FILES) {
		statusString = "Pending... Please wait."
	} else if (status === SenderAdapterConnStatus.DONE) {
		statusString = "Done"
	}

	let buttons = null

	if (isClosed || status === SenderAdapterConnStatus.DONE) {
		buttons = (
			<Button
				variant="danger"
				onClick={() => {
					registry.setConfig(id, {
						stage: SenderAdapterConnStage.CLOSE,
					})
					registry.removeConn(id)
				}}
			>
				Remove
			</Button>
		)
	} else if (status === SenderAdapterConnStatus.AUTHENTICATED_HEADERS_SENT) {
		buttons = (
			<>
				<Button
					variant="success"
					onClick={() => {
						registry.setConfig(id, {
							stage: SenderAdapterConnStage.SEND_ENTRIES,
						})
					}}
				>
					Accept
				</Button>
				<Button
					variant="danger"
					onClick={() => {
						registry.setConfig(id, {
							stage: SenderAdapterConnStage.CLOSE,
						})
						registry.removeConn(id)
					}}
				>
					Deny
				</Button>
			</>
		)
	} else if (status === SenderAdapterConnStatus.SENDING_FILES) {
		buttons = (
			<Button
				variant="danger"
				onClick={() => {
					registry.setConfig(id, {
						stage: SenderAdapterConnStage.CLOSE,
					})
					registry.removeConn(id)
				}}
			>
				Stop
			</Button>
		)
	}

	return (
		<Entry>
			<EntryHeader>Status: {statusString}</EntryHeader>
			{authResult ? (
				<div>
					Connection from: "<b>{authResult.remotePartyName}</b>"
				</div>
			) : null}
			<div>
				<ProgressBar now={Math.round(totalFraction * 100 * 10) / 10} />
			</div>
			<ButtonGroup>{buttons}</ButtonGroup>
		</Entry>
	)
}

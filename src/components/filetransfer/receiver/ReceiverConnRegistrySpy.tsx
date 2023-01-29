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
import { Button, ButtonGroup } from "react-bootstrap"
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
	console.log({ state })
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

const Entry = styled.div``

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
		state: { status, totalDoneFraction, headers },
		config: { stage },
		error,
	} = state

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
			{JSON.stringify({
				status,
				isClosed,
				totalDoneFraction,
				stage,
				auth,
				error,

				headers,
			})}
			{buttons}
		</Entry>
	)
}

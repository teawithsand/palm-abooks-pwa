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
import { Button, ButtonGroup } from "react-bootstrap"
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
			<ButtonGroup>
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
			</ButtonGroup>
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
			{JSON.stringify({
				status,
				isClosed,
				totalFraction,
				stage,
				auth,
				error,
				authResult,

				entriesCount: entries.length,
				entriesSumSize: entries.length
					? entries.map((v) => v.file.size).reduce((a, b) => a + b)
					: 0,
			})}
			{buttons}
		</Entry>
	)
}

const Entry = styled.div``

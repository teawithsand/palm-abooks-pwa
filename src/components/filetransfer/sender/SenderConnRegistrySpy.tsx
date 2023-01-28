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
import { Button } from "react-bootstrap"
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
					v.state.status !== SenderAdapterConnStatus.CONNECTED
			)
			.map(([k, _v]) => k)
	)

	return (
		<Container>
			{!keys.length
				? "No connections so far"
				: keys.map((k) => <SenderConnSpy id={k} registry={registry} />)}
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
		state: { status, totalFraction },
		config: { stage },
	} = state

	return (
		<Entry>
			{JSON.stringify({
				status,
				isClosed,
				totalFraction,
				stage,
				auth,

				entriesCount: entries.length,
				entriesSumSize: entries.length
					? entries.map((v) => v.file.size).reduce((a, b) => a + b)
					: 0,
			})}
			{isClosed ? (
				<Button
					onClick={() => {
						registry.setConfig(id, {
							stage: SenderAdapterConnStage.CLOSE,
						})
						registry.removeConn(id)
					}}
				>
					Delete
				</Button>
			) : (
				<Button
					onClick={() => {
						registry.setConfig(id, {
							stage: SenderAdapterConnStage.SEND_ENTRIES,
						})
					}}
				>
					Accept
				</Button>
			)}
		</Entry>
	)
}

const Entry = styled.div``

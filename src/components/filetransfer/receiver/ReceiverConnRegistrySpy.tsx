import { ReceiverAppendToAbook } from "@app/components/filetransfer/receiver/ReceiverAppendToAbook"
import { ReceiverDownloadAll } from "@app/components/filetransfer/receiver/ReceiverDownloadAll"
import {
	ReceiverFileList,
	ReceiverFileListEntry,
} from "@app/components/filetransfer/receiver/ReceiverFileList"
import {
	FileTransferConn,
	ReceiverAdapterConnConfig,
	ReceiverAdapterConnStage,
	ReceiverAdapterConnState,
	ReceiverAdapterConnStatus,
	ReceiverAdapterInitData,
} from "@app/domain/filetransfer"
import { ConnRegistry } from "@teawithsand/tws-peer"
import { DownloadApiHelper, generateUUID } from "@teawithsand/tws-stl"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React, { useMemo } from "react"
import { Button, ButtonGroup, ProgressBar } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
	grid-template-columns: auto;
`

const Header = styled.h3`
	font-size: 1.33em;
	font-weight: bold;
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

export const isSaveAsSupported =
	typeof window !== "undefined" && "showSaveFilePicker" in window

export const saveAsUtil = async (blob: Blob | File, name: string) => {
	const id = generateUUID()
	const handle = await (window as any).showSaveFilePicker({
		suggestedName: name,
		id,
		types: {
			description: `File: ${name}`,
			accept: {},
		},
	})

	const writable = await handle.createWritable()
	await writable.write(blob)
	await writable.close()

	handle.close()
}

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
		state: {
			status,
			totalDoneFraction,
			headers,
			authResult,
			doneEntries,
			currentEntryDoneFraction,
		},
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
			<>
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
			</>
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

	let entries: ReceiverFileListEntry[] | null = useMemo(() => {
		if (!headers) return null

		console.log({
			doneEntries,
			sz: doneEntries.length,
			currentEntryDoneFraction,
		})

		return headers.map((h, i) => {
			let doneFraction = 0
			if (doneEntries.length > i) {
				doneFraction = 1
			} else if (i === doneEntries.length) {
				doneFraction = currentEntryDoneFraction
			}
			return {
				header: h,
				doneFraction,
				onDownload: doneEntries[i]
					? () => {
							DownloadApiHelper.instance
								.blob(doneEntries[i].file)
								.download(doneEntries[i].publicName)
					  }
					: undefined,
				onSaveAs:
					doneEntries[i] && isSaveAsSupported
						? () => {
								DownloadApiHelper.instance
									.blob(doneEntries[i].file)
									.save(doneEntries[i].publicName)
						  }
						: undefined,
				onPreview: doneEntries[i]
					? () => {
							DownloadApiHelper.instance
								.blob(doneEntries[i].file)
								.open()
					  }
					: undefined,
			}
		})
	}, [headers, doneEntries, currentEntryDoneFraction])

	return (
		<Entry>
			<EntryHeader>Status: {statusString}</EntryHeader>
			{authResult ? (
				<div>
					Connection from: "<b>{authResult.remotePartyName}</b>"
				</div>
			) : null}
			<div>
				<ProgressBar
					now={Math.round(totalDoneFraction * 100 * 10) / 10}
				/>
			</div>

			{entries ? (
				<>
					<Header>File list</Header>
					<ReceiverFileList entries={entries} />
				</>
			) : null}
			{doneEntries && status === ReceiverAdapterConnStatus.DONE ? (
				<>
					<Header>Download all files</Header>
					<ReceiverDownloadAll entries={doneEntries} />
				</>
			) : null}
				{doneEntries && status === ReceiverAdapterConnStatus.DONE ? (
				<>
					<Header>Save files to existing ABook</Header>
					<ReceiverAppendToAbook entries={doneEntries} />
				</>
			) : null}
			<Header>Transfer management</Header>
			<ButtonGroup>{buttons}</ButtonGroup>
		</Entry>
	)
}

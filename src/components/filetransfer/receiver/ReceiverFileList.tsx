import { FileTransferEntryHeader } from "@app/domain/filetransfer"
import styled from "styled-components"
import React, { useMemo } from "react"
import { formatFileSize } from "@teawithsand/tws-stl"
import { Button, ButtonGroup, ProgressBar } from "react-bootstrap"
import { BREAKPOINT_MD, breakpointMediaDown } from "@teawithsand/tws-stl-react"

export type ReceiverFileListEntry = {
	header: FileTransferEntryHeader
	doneFraction?: number
	onDownload?: () => void
	onSaveAs?: () => void
	onPreview?: () => void
}

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: auto;
	gap: 0.5em;

	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 0.25em;
	padding: 0.5em;
`

const EntryName = styled.div`
	font-size: 1.25em;
`

const Entry = (props: { entry: ReceiverFileListEntry; index: number }) => {
	const {
		header,
		doneFraction = 0,
		onDownload,
		onSaveAs,
		onPreview,
	} = props.entry

	return (
		<Container>
			<div>
				<EntryName>
					Name: <b>{header.publicName}</b>
				</EntryName>
				<div>Size: {formatFileSize(header.size)}</div>
				<div>Progress: {Math.round(doneFraction * 100 * 10) / 10}%</div>
			</div>
			<ProgressBar now={Math.round(doneFraction * 100 * 10) / 10} />
			<ButtonGroup>
				{onDownload ? (
					<Button variant="success" onClick={() => onDownload()}>
						Download
					</Button>
				) : null}
				{onSaveAs ? (
					<Button onClick={() => onSaveAs()}>Save as</Button>
				) : null}
				{onPreview ? (
					<Button variant="warning" onClick={() => onPreview()}>
						Preview
					</Button>
				) : null}
			</ButtonGroup>
		</Container>
	)
}

const List = styled.ol`
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: 1fr 1fr;
	@media ${breakpointMediaDown(BREAKPOINT_MD)} {
		grid-template-columns: auto;
	}
	gap: 0.75em;

	padding: 0;
	margin: 0;
	list-style-type: none;
`

const Header = styled.div`
	font-size: 1.25em;
	padding-bottom: 0.5em;
	font-weight: bold;
`

export const ReceiverFileList = (props: {
	entries: ReceiverFileListEntry[]
}) => {
	const { entries } = props
	const totalSize = useMemo(
		() =>
			entries.length
				? entries.map((v) => v.header.size).reduce((a, b) => a + b)
				: 0,
		[entries]
	)

	return (
		<div>
			<Header>
				Total: {formatFileSize(totalSize)}; {entries.length} entries
			</Header>
			<List>
				{entries.map((v, i) => (
					<Entry index={i} entry={v} key={i} />
				))}
			</List>
		</div>
	)
}

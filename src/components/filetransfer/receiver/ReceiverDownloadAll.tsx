import { FileTransferEntryHeader } from "@app/domain/filetransfer"
import styled from "styled-components"
import React, { useMemo, useState } from "react"
import { formatFileSize } from "@teawithsand/tws-stl"
import { Button, ButtonGroup, Collapse, ProgressBar } from "react-bootstrap"
import { ReceiverFileListEntry } from "@app/components/filetransfer/receiver/ReceiverFileList"


const List = styled.ol`
	display: grid;
	grid-auto-flow: row;
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

export type ReceiverDownloaderEntry = {
	name: string,
	blob: Blob | File
}

export const ReceiverDownloadAll = (props: {
	blobs: ReceiverDownloaderEntry[]
}) => {
	const [showCollapse, setShowCollapse] = useState(false)
	return (
		<div>
			<Collapse in={showCollapse}>
				<div>
					
				</div>
			</Collapse>
		</div>
	)
}

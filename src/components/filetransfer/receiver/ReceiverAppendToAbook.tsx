import { Abook } from "@app/domain/defines/abook"
import { FileEntry, FileEntryType } from "@app/domain/defines/abookFile"
import { FileTransferEntry } from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { useMutation, useQuery } from "@tanstack/react-query"
import { generateUUID } from "@teawithsand/tws-stl"
import React, { useState } from "react"
import { Alert, Button, Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	padding: 0.5em;
	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 0.5em;
	display: grid;
	grid-auto-flow: row;
	gap: 0.5em;
`

export const ReceiverAppendToAbook = (props: {
	entries: FileTransferEntry[]
}) => {
	const [pickedAbook, setPickedAbook] = useState<Abook | null>(null)
	const app = useAppManager()
	const {
		isError,
		isLoading,
		data: rawAbooks,
	} = useQuery(
		["abook", "list"],
		async () => {
			return await app.abookDb.listAbooks()
		},
		{
			suspense: false,
		}
	)

	const saveMutation = useMutation(
		async (args: { files: File[]; abook: Abook }) => {
			const { abook, files } = args
			const abookAccess = await app.abookDb.abookWriteAccess(abook.id)

			try {
				for (const f of files) {
					await abookAccess.addInternalFile(f, (draft, newFileId) => {
						const entry: FileEntry = {
							id: generateUUID(),
							metadata: {
								name: f.name,
								mime: "application/binary",
								size: f.size,
								disposition: null, // this is for overrides, by default use dynamic disposition
								musicMetadata: null,
							},
							data: {
								dataType: FileEntryType.INTERNAL_FILE,
								internalFileId: newFileId,
							},
						}

						draft.entries.push(entry)
					})
				}
			} finally {
				abookAccess.release()
			}
		}
	)

	// TODO(teawithsand): proper error handling/explaining to user
	if (isLoading || isError) return <></>

	const abooks = rawAbooks ?? []

	if (abooks.length === 0) {
		return (
			<Alert variant="warning">
				No ABook to add files to. Create some ABook, so files can be
				added to it.
			</Alert>
		)
	}

	if (saveMutation.isSuccess) {
		if (!pickedAbook) return <></>
		return (
			<Alert variant="success">
				Saved files to "<b>{pickedAbook.metadata.title}</b>"
			</Alert>
		)
	}

	return (
		<Container>
			{saveMutation.isError ? (
				<Alert variant="error">Saved files to ABook.</Alert>
			) : null}
			<Form.Group>
				<Form.Label>ABook to append data to</Form.Label>
				<Form.Select
					value={pickedAbook?.id || undefined}
					onChange={(e) => {
						const abook = abooks.find(
							(abook) => abook.id === e.target.value
						)
						setPickedAbook(abook ?? null)
					}}
				>
					<option>Pick ABook</option>
					{abooks.map((v) => (
						<option value={v.id}>{v.metadata.title}</option>
					))}
				</Form.Select>
				{pickedAbook ? (
					<Button
						onClick={() => {
							if (!pickedAbook) return
							saveMutation.mutateAsync({
								abook: pickedAbook,
								files: props.entries.map((v) => v.file),
							})
						}}
					>
						Save files to ABook
					</Button>
				) : null}
			</Form.Group>
		</Container>
	)
}

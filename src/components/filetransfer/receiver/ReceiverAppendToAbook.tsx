import { AbookEntity } from "@app/domain/defines/entity/abook"
import { FileTransferEntry } from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { useMutationAbookAddFileTransferEntity } from "@app/domain/storage/mutations/abookAddFileTransferEntries"
import { useQuery } from "@tanstack/react-query"
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
	const [pickedAbook, setPickedAbook] = useState<AbookEntity | null>(null)
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

	const mutation = useMutationAbookAddFileTransferEntity()

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

	if (mutation.isSuccess) {
		if (!pickedAbook) return <></>
		return (
			<Alert variant="success">
				Saved files to "<b>{pickedAbook.displayName}</b>"
			</Alert>
		)
	}

	return (
		<Container>
			{mutation.isError ? (
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
						<option value={v.id}>{v.displayName}</option>
					))}
				</Form.Select>
				{pickedAbook ? (
					<Button
						onClick={() => {
							if (!pickedAbook) return
							mutation.mutateAsync({
								abook: pickedAbook,
								transferEntries: props.entries,
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

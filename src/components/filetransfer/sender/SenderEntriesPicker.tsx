import { FilesFinalField } from "@app/components/util/FilesFinalField"
import {
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import arrayMutators from "final-form-arrays"
import React, { useMemo } from "react"
import { Button, Form } from "react-bootstrap"
import { Form as FinalForm } from "react-final-form"

type AbookFormAddFilesData = {
	files: File[]
}

export const SenderEntriesPicker = () => {
	const initialValues: AbookFormAddFilesData = useMemo(
		() => ({
			files: [],
		}),
		[]
	)

	const senderStateManager = useSenderStateManager()
	const transferStateManager = useFileTransferStateManager()
	const canSetEntries = useStickySubscribableSelector(
		transferStateManager.peer.stateBus,
		(state) => !state.isActive
	)

	return (
		<FinalForm<AbookFormAddFilesData>
			onSubmit={(values: AbookFormAddFilesData) => {
				if (canSetEntries) {
						senderStateManager.setFileTransferData({
							entries: (values?.files ?? [])?.map((v) => ({
							file: v,
							publicName: v.name,
							})),
							untypedHeader: undefined,
						})
				}
			}}
			mutators={{
				...arrayMutators,
			}}
			initialValues={initialValues}
			render={({ handleSubmit, submitting, pristine }) => (
				<Form onSubmit={handleSubmit}>
					<FilesFinalField name="files" disabled={!canSetEntries} />

					<Button
						className="mt-2"
						disabled={submitting || pristine}
						type="submit"
					>
						Set entries
					</Button>
				</Form>
			)}
		/>
	)
}

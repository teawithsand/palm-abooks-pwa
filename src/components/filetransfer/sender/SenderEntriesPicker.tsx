import { FilesFinalField } from "@app/components/util/FilesFinalField"
import {
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import arrayMutators from "final-form-arrays"
import React, { useMemo } from "react"
import { Form } from "react-bootstrap"
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
					senderStateManager.setEntries(
						(values?.files ?? [])?.map((v) => ({
							file: v,
							publicName: v.name,
							sha512hash: "NIY",
						}))
					)
				}
			}}
			// TODO(teawithsand): auto value updating in less hacky way
			debug={(_, values) => {
				if (canSetEntries) {
					senderStateManager.setEntries(
						(values?.files?.value ?? [])?.map((v: File) => ({
							file: v,
							publicName: v.name,
							sha512hash: "NIY",
						}))
					)
				}
			}}
			mutators={{
				...arrayMutators,
			}}
			initialValues={initialValues}
			render={({ handleSubmit }) => (
				<Form onSubmit={handleSubmit}>
					<FilesFinalField name="files" disabled={!canSetEntries} />
				</Form>
			)}
		/>
	)
}

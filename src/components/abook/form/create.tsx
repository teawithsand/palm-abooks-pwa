import { FilesFinalField } from "@app/components/util/FilesFinalField"
import {
	AbookFormMetadataFields,
	AbookMetadataFormData,
} from "@app/components/abook/form/editMetadata"
import arrayMutators from "final-form-arrays"
import React, { useMemo } from "react"
import { Button, Form } from "react-bootstrap"
import { Form as FinalForm } from "react-final-form"

export type CreateAbookFormData = {
	files: File[]
} & AbookMetadataFormData

export const AbookFormCreate = (props: {
	initialData?: CreateAbookFormData
	onSubmit: (data: CreateAbookFormData) => Promise<void>
}) => {
	const initialValues: CreateAbookFormData = useMemo(
		() => ({
			description: "",
			title: "",
			author: "",

			...(props.initialData ?? {}),
			// files should be unset always, as they are problematic when it comes to file field.
			// Aside from that: for now there is no good reason for passing any files here
			files: [],
		}),
		[props.initialData]
	)
	return (
		<FinalForm<CreateAbookFormData>
			onSubmit={(values: any) =>
				props.onSubmit({
					...values,
				})
			}
			mutators={{
				...arrayMutators,
			}}
			initialValues={initialValues}
			render={({ handleSubmit, submitting, pristine }) => (
				<Form onSubmit={handleSubmit}>
					<AbookFormMetadataFields />
					<FilesFinalField name="files" />

					<Button
						className="mt-2"
						disabled={submitting || pristine}
						type="submit"
					>
						Submit
					</Button>
				</Form>
			)}
		/>
	)
}

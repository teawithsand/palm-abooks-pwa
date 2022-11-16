import { FilesFinalField } from "@app/components/util/FilesFinalField"
import arrayMutators from "final-form-arrays"
import React, { useMemo } from "react"
import { Button, Form } from "react-bootstrap"
import { Form as FinalForm } from "react-final-form"

export type AbookFormAddFilesData = {
	files: File[]
}

export const AbookFormAddFiles = (props: {
	onSubmit: (data: AbookFormAddFilesData) => Promise<void>
}) => {
	const initialValues: AbookFormAddFilesData = useMemo(
		() => ({
			files: [],
		}),
		[]
	)
	return (
		<FinalForm<AbookFormAddFilesData>
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

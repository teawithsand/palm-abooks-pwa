import React, { useMemo } from "react"
import { Form } from "react-bootstrap"

import { Field as FinalField } from "react-final-form"

import arrayMutators from "final-form-arrays"
import { Button } from "react-bootstrap"
import { Form as FinalForm } from "react-final-form"

// TODO(teawithsand): add validation on these fields
export const AbookFormMetadataFields = () => {
	return (
		<>
			<Form.Group className="mb-3">
				<Form.Label>Book name</Form.Label>

				<FinalField name="title">
					{({ input }) => <Form.Control type="text" {...input} />}
				</FinalField>
			</Form.Group>

			<Form.Group className="mb-3">
				<Form.Label>Book author</Form.Label>

				<FinalField name="author">
					{({ input }) => <Form.Control type="text" {...input} />}
				</FinalField>
			</Form.Group>

			<Form.Group className="mb-3">
				<Form.Label>Book description</Form.Label>

				<FinalField name="description">
					{({ input }) => <Form.Control as="textarea" {...input} />}
				</FinalField>
			</Form.Group>
		</>
	)
}

export interface AbookMetadataFormData {
	title: string
	description: string
	author: string
}

export const AbookFormMetadata = (props: {
	initialData?: AbookMetadataFormData
	onSubmit: (data: AbookMetadataFormData) => Promise<void>
}) => {
	const initialValues: AbookMetadataFormData = useMemo(
		() => ({
			description: "",
			title: "",
			author: "",

			...(props.initialData ?? {}),
		}),
		[props.initialData]
	)
	return (
		<FinalForm<AbookMetadataFormData>
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

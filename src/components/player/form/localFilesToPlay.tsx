import { FilesFinalField } from "@app/components/util/FilesFinalField"
import arrayMutators from "final-form-arrays"
import React, { useMemo } from "react"
import { Button, Form } from "react-bootstrap"
import { Form as FinalForm } from "react-final-form"

export type PlayLocalFilesFormData = {
	files: File[]
}

const locallyPlayableMimeAndExt = ["*.mp3", "audio/mpeg"]

export const PlayLocalFilesForm = (props: {
	onSubmit: (data: PlayLocalFilesFormData) => Promise<void>
}) => {
	const initialValues: PlayLocalFilesFormData = useMemo(
		() => ({
			files: [],
		}),
		[]
	)
	return (
		<FinalForm<PlayLocalFilesFormData>
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
					<FilesFinalField
						name="files"
						label="Files to play"
						accept={locallyPlayableMimeAndExt}
					/>

					<Button
						className="mt-2"
						disabled={submitting || pristine}
						type="submit"
					>
						Play
					</Button>
				</Form>
			)}
		/>
	)
}

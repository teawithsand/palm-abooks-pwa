import { AbookFormMetadata } from "@app/components/abook/form/editMetadata"
import { Abook } from "@app/domain/defines/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import React from "react"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

export const AbookMetadataEdit = (props: { abook: Abook }) => {
	const { abook } = props
	const { metadata } = abook
	const { abookShowPath } = useAppPaths()
	const navigate = useNavigate()
	const app = useAppManager()

	return (
		<Grid>
			<AbookFormMetadata
				onSubmit={async (data) => {
					// TODO(teawithsand): implement

					const access = await app.abookDb.abookWriteAccess(abook.id)
					try {
						await access.update((draft) => {
							draft.metadata.authorName = data.author
							draft.metadata.title = data.title
							draft.metadata.description = data.description
						})
					} finally {
						access.release()
					}

					navigate(abookShowPath(abook.id))
				}}
				initialData={{
					author: metadata.authorName,
					description: metadata.description,
					title: metadata.title,
				}}
			/>
		</Grid>
	)
}

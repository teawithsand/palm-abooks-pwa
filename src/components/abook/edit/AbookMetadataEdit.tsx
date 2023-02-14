import { AbookFormMetadata } from "@app/components/abook/form/editMetadata"
import { AbookEntity } from "@app/domain/defines/entity/abook"
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

export const AbookMetadataEdit = (props: { abook: AbookEntity }) => {
	const { abook } = props
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
							draft.authorName = data.author.trim()
							draft.title = data.title.trim()
							draft.description = data.description.trim()
						})
					} finally {
						access.release()
					}

					navigate(abookShowPath(abook.id))
				}}
				initialData={{
					author: abook.authorName,
					description: abook.description,
					title: abook.title,
				}}
			/>
		</Grid>
	)
}

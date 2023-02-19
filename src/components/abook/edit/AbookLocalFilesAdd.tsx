import { AbookFormAddFiles } from "@app/components/abook/form/addFiles"
import { AbookEntity } from "@app/domain/defines/entity/abook"
import { useMutationAbookAddFiles } from "@app/domain/storage/mutations/abookAddFiles"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import React from "react"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

export const AbookLocalFilesAdd = (props: { abook: AbookEntity }) => {
	const { abook } = props
	const { abookShowPath } = useAppPaths()
	const navigate = useNavigate()
	const mutation = useMutationAbookAddFiles()

	return (
		<Grid>
			<AbookFormAddFiles
				onSubmit={async (data) => {
					await mutation.mutateAsync({
						abook,
						files: data.files,
					})

					navigate(abookShowPath(abook.id))
				}}
			/>
		</Grid>
	)
}

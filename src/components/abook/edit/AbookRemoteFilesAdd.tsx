import { AbookFormAddFiles } from "@app/components/abook/form/addFiles"
import { Abook } from "@app/domain/defines/abook"
import { useAppManager } from "@app/domain/managers/app"
import React from "react"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

export const AbookRemoteFilesAdd = (props: { abook: Abook }) => {
	const app = useAppManager()

	return (
		<Grid>
			<AbookFormAddFiles onSubmit={async (data) => {}} />
		</Grid>
	)
}

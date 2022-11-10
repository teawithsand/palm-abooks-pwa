import { AbookFormMetadata } from "@app/components/abook/form/editMetadata"
import { Abook } from "@app/domain/defines/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import React from "react"
import styled from "styled-components"
import { Button } from "react-bootstrap"
import { LinkContainer } from "@app/util/LinkContainer"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

const Heading = styled.div`
	font-size: 1.2em;
	text-align: center;
`

const DescriptionRow = styled.div``

const OptionsBar = styled.div`
	width: 100%;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;

	width: 100%;
	gap: 1em;

	& > * {
		flex: 1 1 0;
	}
`

export const AbookDelete = (props: { abook: Abook }) => {
	const { abook } = props
	const { metadata } = abook
	const { abookListPath } = useAppPaths()
	const navigate = useNavigate()
	const app = useAppManager()

	return (
		<Grid>
			<Heading>
				Are you sure you want to delete "{metadata.title}" by "
				{metadata.authorName}"
			</Heading>
			{metadata.description ? (
				<DescriptionRow>{metadata.description}</DescriptionRow>
			) : null}
			<hr />
			<OptionsBar>
				<LinkContainer to={abookListPath}>
					<Button variant="secondary" href="#">
						Cancel
					</Button>
				</LinkContainer>
				{/* TODO: pack all of this to form to prevent double submit*/}
				<Button
					variant="danger"
					onClick={async () => {
						const access = await app.abookDb.abookWriteAccess(
							abook.id
						)
						try {
							await access.delete()
						} finally {
							access.release()
						}

						navigate(abookListPath)
					}}
				>
					Delete
				</Button>
			</OptionsBar>
		</Grid>
	)
}

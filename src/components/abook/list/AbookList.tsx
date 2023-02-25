import { AbookSmallCard } from "@app/components/abook/list/AbookSmallCard"
import { AbookEntity } from "@app/domain/defines/entity/abook"
import { useAppPaths } from "@app/paths"
import { LinkContainer } from "@app/util/LinkContainer"
import React from "react"
import { Button } from "react-bootstrap"
import styled from "styled-components"

const List = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

const NoAbooksContainer = styled.div`
	display: grid;
	gap: 1em;
	grid-auto-flow: row;
	text-align: center;
`

export const AbookList = (props: { abooks: AbookEntity[] }) => {
	const { abookAddLocalPath } = useAppPaths()
	if (!props.abooks.length) {
		return (
			<NoAbooksContainer>
				<div>You haven't added any abooks yet.</div>
				<div>
					<LinkContainer to={abookAddLocalPath}>
						<Button href="#">
							Here you may add some from local device
						</Button>
					</LinkContainer>
				</div>
			</NoAbooksContainer>
		)
	}
	return (
		<List>
			{props.abooks.map((v, i) => (
				<AbookSmallCard abook={v} key={i} />
			))}
		</List>
	)
}

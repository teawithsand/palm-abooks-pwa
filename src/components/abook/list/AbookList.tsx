import { AbookSmallCard } from "@app/components/abook/list/AbookSmallCard"
import { Abook } from "@app/domain/defines/abook"
import React from "react"
import styled from "styled-components"

const List = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

export const AbookList = (props: { abooks: Abook[] }) => {
	return (
		<List>
			{props.abooks.map((v, i) => (
				<AbookSmallCard abook={v} key={i} />
			))}
		</List>
	)
}

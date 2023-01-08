import { PageContainer } from "@app/components/PageContainer"
import { useAppManager } from "@app/domain/managers/app"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"
import { Button } from "react-bootstrap"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;

	grid-auto-flow: row;
	gap: 1em;
`

const DebugPage = () => {
	const app = useAppManager()

	return (
		<PageContainer title="Debug stuff">
			<Grid>
				<Button
					onClick={() => {
						app.abookDb.clear()
					}}
				>
					Clear DB
				</Button>
			</Grid>
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(DebugPage))

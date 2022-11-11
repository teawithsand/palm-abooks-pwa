import { PageContainer } from "@app/components/PageContainer"
import { useAppManager } from "@app/domain/managers/app"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"

const PlayerPage = () => {
	const app = useAppManager()
	const wtp = useStickySubscribable(app.whatToPlayManager.bus)

	return (
		<PageContainer>
			<div>Player stuff goes here</div>
			<div>{JSON.stringify(wtp)}</div>
		</PageContainer>
	)
}

export default PlayerPage

import { PageContainer } from "@app/components/PageContainer"
import {
	PlayerEntriesDisplay,
	usePlayerEntriesDisplayData,
} from "@app/components/player/PlayerEntriesDisplay"
import { useAppManager } from "@app/domain/managers/app"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"

const PlayerPage = () => {
	const app = useAppManager()
	const wtp = useStickySubscribable(app.whatToPlayManager.bus)

	const playerEntriesDisplayData = usePlayerEntriesDisplayData()
	return (
		<PageContainer>
			<div>Player stuff goes here</div>
			<div>
				{playerEntriesDisplayData ? (
					<PlayerEntriesDisplay {...playerEntriesDisplayData} />
				) : "Nothing to play :("}
			</div>
		</PageContainer>
	)
}

export default PlayerPage

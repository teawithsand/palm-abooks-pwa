import { PageContainer } from "@app/components/PageContainer"
import { PlayerEntriesList } from "@app/components/player/list/PlayerEntriesList"
import { usePlayerEntriesDisplayData } from "@app/components/player/list/types"
import { useAppManager } from "@app/domain/managers/app"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"

const PlayerPage = () => {
	const app = useAppManager()
	const wtp = useStickySubscribable(app.whatToPlayManager.bus)

	const playerEntriesDisplayData = usePlayerEntriesDisplayData()
	return (
		<PageContainer
			options={{
				title: "",
			}}
		>
			{playerEntriesDisplayData ? (
				<PlayerEntriesList {...playerEntriesDisplayData} />
			) : (
				"Nothing to play :("
			)}
		</PageContainer>
	)
}

export default PlayerPage

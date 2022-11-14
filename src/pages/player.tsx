import { PageContainer } from "@app/components/PageContainer"
import { PlayerMusicUi } from "@app/components/player/PlayerMusicUi"
import React from "react"

const PlayerPage = () => {
	return (
		<PageContainer
			options={{
				title: "",
			}}
		>
			<PlayerMusicUi />
		</PageContainer>
	)
}

export default PlayerPage

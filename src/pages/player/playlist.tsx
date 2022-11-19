import { PageContainer } from "@app/components/PageContainer"
import { PlayerPlaylistUi } from "@app/components/player/PlayerPlaylistUi"
import { wrapLocationProvider } from "@app/util/useLocation"
import React from "react"

const PlayerPlaylistPage = () => {
	return (
		<PageContainer title="Playlist">
			<PlayerPlaylistUi />
		</PageContainer>
	)
}

export default wrapLocationProvider(PlayerPlaylistPage)

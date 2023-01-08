import { PageContainer, PageContainerType } from "@app/components/PageContainer"
import { PlayerMusicUi } from "@app/components/player/PlayerUi"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const PlayerPage = () => {
	return (
		<PageContainer type={PageContainerType.FIXED_HEIGHT} hasFooter={false}>
			<PlayerMusicUi />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(PlayerPage))

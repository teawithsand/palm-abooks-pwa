import { PageContainer, PageContainerType } from "@app/components/PageContainer"
import { PlayerSettings } from "@app/components/player/settings/playerSettings"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const PlayerOptionsPage = () => {
	return (
		<PageContainer type={PageContainerType.NORMAL} title="Player settings">
			<PlayerSettings />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(PlayerOptionsPage))

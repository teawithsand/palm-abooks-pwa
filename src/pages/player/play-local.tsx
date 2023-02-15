import { PageContainer, PageContainerType } from "@app/components/PageContainer"
import { PlayLocalFilesForm } from "@app/components/player/form/localFilesToPlay"
import { WhatToPlayLocatorType } from "@app/domain/defines/whatToPlay/locator"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const PlayerPlayLocalFilesPage = () => {
	const app = useAppManager()
	const navigate = useNavigate()
	const { playerUiPath } = useAppPaths()
	return (
		<PageContainer type={PageContainerType.NORMAL} title="Play local files">
			<PlayLocalFilesForm
				onSubmit={async (data) => {
					app.whatToPlayManager.setLocator({
						type: WhatToPlayLocatorType.RAW_ENTRIES,
						files: data.files,
					})
					app.playerActionsManager.setIsPlaying(true)
					navigate(playerUiPath)
				}}
			/>
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(PlayerPlayLocalFilesPage))

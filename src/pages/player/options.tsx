import { PageContainer } from "@app/components/PageContainer"
import { wrapLocationProvider } from "@app/util/useLocation"
import React from "react"

const PlayerOptionsPage = () => {
	return (
		<PageContainer>
			{
				// TODO(teawithsand): implement this page. Add things like speed here.
			}
		</PageContainer>
	)
}

export default wrapLocationProvider(PlayerOptionsPage)

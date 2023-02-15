import { AbookLocalCreate } from "@app/components/abook/edit/AbookLocalCreate"
import { PageContainer } from "@app/components/PageContainer"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const AddLocalAbookPage = () => {
	const navigate = useNavigate()
	const { abookShowPath } = useAppPaths()
	const app = useAppManager()

	return (
		<PageContainer title="Add Abook from local device">
			<AbookLocalCreate />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(AddLocalAbookPage))

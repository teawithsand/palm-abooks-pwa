import { PageContainer } from "@app/components/PageContainer"
import { StoragePanel } from "@app/components/storage/StoragePanel"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const IndexPage = () => {
	return (
		<PageContainer title="Storage information">
			<StoragePanel />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(IndexPage))

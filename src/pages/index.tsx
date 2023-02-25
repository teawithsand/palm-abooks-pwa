import { PageContainer } from "@app/components/PageContainer"
import { Home } from "@app/components/misc/home"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const IndexPage = () => {
	return (
		<PageContainer>
			<Home />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(IndexPage))

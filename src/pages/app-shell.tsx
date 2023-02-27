import { PageContainer, PageContainerType } from "@app/components/PageContainer"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const AppShellPage = () => {
	return <PageContainer type={PageContainerType.NORMAL}></PageContainer>
}

export default wrapNoSSR(wrapLocationProvider(AppShellPage))

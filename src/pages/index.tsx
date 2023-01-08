import { PageContainer } from "@app/components/PageContainer"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"



const IndexPage = () => {
	return <PageContainer></PageContainer>
}

export default wrapNoSSR(wrapLocationProvider(IndexPage))

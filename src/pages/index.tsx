import { PageContainer } from "@app/components/PageContainer"
import { wrapLocationProvider } from "@app/util/useLocation"
import React from "react"



const IndexPage = () => {
	return <PageContainer></PageContainer>
}

export default wrapLocationProvider(IndexPage)

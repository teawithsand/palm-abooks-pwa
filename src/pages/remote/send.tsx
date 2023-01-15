import { PageContainer } from "@app/components/PageContainer"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const InnerPage = () => {
	return <>NIY</>
}

const SendFilesPage = () => {
	return (
		<PageContainer title="Send local files to other device">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(SendFilesPage))

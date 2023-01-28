import { PageContainer } from "@app/components/PageContainer"
import { AutonomousFileSender } from "@app/components/filetransfer/send"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const InnerPage = () => {
	return <AutonomousFileSender />
}

const SendFilesPage = () => {
	return (
		<PageContainer title="Send local files to other device">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(SendFilesPage))

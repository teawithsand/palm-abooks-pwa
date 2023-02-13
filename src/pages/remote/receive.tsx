import { PageContainer } from "@app/components/PageContainer"
import { AutonomousFileReceiver } from "@app/components/filetransfer/AutonomousFileReceiver"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const InnerPage = () => {
	return <AutonomousFileReceiver />
}

const SendFilesPage = () => {
	return (
		<PageContainer title="Receive files to local device">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(SendFilesPage))

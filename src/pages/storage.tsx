import { PageContainer } from "@app/components/PageContainer"
import { StoragePanel } from "@app/components/storage/StoragePanel"
import React from "react"

const IndexPage = () => {
	return (
		<PageContainer
			options={{
				title: "Storage information",
			}}
		>
			<StoragePanel />
		</PageContainer>
	)
}

export default IndexPage

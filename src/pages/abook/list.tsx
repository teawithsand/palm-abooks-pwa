import { AbookList } from "@app/components/abook/list/AbookList"
import { PageContainer } from "@app/components/PageContainer"
import { useAppManager } from "@app/domain/managers/app"
import { useQueryAbookList } from "@app/domain/storage/queries/abook"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const InnerPage = () => {
	const abooks = useQueryAbookList()
	return <AbookList abooks={abooks} />
}

const ListAbookPage = () => {
	return (
		<PageContainer title="Abook list">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(ListAbookPage))

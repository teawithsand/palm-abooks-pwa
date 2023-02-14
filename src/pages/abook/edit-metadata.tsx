import { AbookMetadataEdit } from "@app/components/abook/edit/AbookMetadataEdit"
import { PageContainer } from "@app/components/PageContainer"
import { useAbookId } from "@app/components/util/useAbookId"
import { useAppManager } from "@app/domain/managers/app"
import { useQueryAbookById } from "@app/domain/storage/queries/abook"
import { wrapLocationProvider } from "@app/util/useLocation"
import { useQuery } from "@tanstack/react-query"
import { throwExpression } from "@teawithsand/tws-stl"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const InnerPage = () => {
	const app = useAppManager()
	const abookId = useAbookId()
	const abook = useQueryAbookById(abookId)

	return (
		<AbookMetadataEdit
			abook={
				abook?? throwExpression(new Error(`Unreachable code`))
			}
		/>
	)
}

const EditAbookMetadataPage = () => {
	return (
		<PageContainer title="Edit Abook">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(EditAbookMetadataPage))

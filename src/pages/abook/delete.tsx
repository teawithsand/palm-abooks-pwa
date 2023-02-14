import { AbookDelete } from "@app/components/abook/edit/AbookDelete"
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
		<AbookDelete
			abook={
				abook ?? throwExpression(new Error(`Unreachable code`))
			}
		/>
	)
}

const DeleteAbookPage = () => {
	return (
		<PageContainer title="Remove Abook">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(DeleteAbookPage))

import { AbookLocalFilesAdd } from "@app/components/abook/edit/AbookLocalFilesAdd"
import { PageContainer } from "@app/components/PageContainer"
import { useAbookId } from "@app/components/util/useAbookId"
import { useAppManager } from "@app/domain/managers/app"
import { wrapLocationProvider } from "@app/util/useLocation"
import { useQuery } from "@tanstack/react-query"
import { throwExpression } from "@teawithsand/tws-stl"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const InnerPage = () => {
	const app = useAppManager()
	const abookId = useAbookId()
	const result = useQuery(["abook", abookId], async () => {
		const access = await app.abookDb.abookWriteAccess(abookId)
		try {
			return access.getAbook()
		} finally {
			access.release()
		}
	})

	return (
		<AbookLocalFilesAdd
			abook={
				result.data ?? throwExpression(new Error(`Unreachable code`))
			}
		/>
	)
}

const AbookLocalFilesAddPage = () => {
	return (
		<PageContainer title="Add local files to existing Abook">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(AbookLocalFilesAddPage))

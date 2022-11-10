import { AbookDelete } from "@app/components/abook/edit/AbookDelete"
import { PageContainer } from "@app/components/PageContainer"
import { useAbookId } from "@app/components/util/useAbookId"
import { useAppManager } from "@app/domain/managers/app"
import { useQuery } from "@tanstack/react-query"
import { throwExpression } from "@teawithsand/tws-stl"
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
		<AbookDelete
			abook={
				result.data ?? throwExpression(new Error(`Unreachable code`))
			}
		/>
	)
}

const DeleteAbookPage = () => {
	return (
		<PageContainer
			options={{
				title: "Abook delete",
			}}
		>
			<InnerPage />
		</PageContainer>
	)
}

export default DeleteAbookPage

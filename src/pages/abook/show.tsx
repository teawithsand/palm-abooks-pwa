import { AbookView } from "@app/components/abook/view/AbookView"
import { PageContainer } from "@app/components/PageContainer"
import { useAppManager } from "@app/domain/managers/app"
import { useQuery } from "@tanstack/react-query"
import { throwExpression } from "@teawithsand/tws-stl"
import React from "react"

const InnerPage = () => {
	const app = useAppManager()
	// FIXME: use some watcher instead of doing this
	const abookId = new URLSearchParams(window.location.search).get("id")
	if (!abookId) throw new Error("not id")
	const result = useQuery(["abook", abookId], async () => {
		const access = await app.abookDb.abookWriteAccess(abookId)
		try {
			return access.getAbook()
		} finally {
			access.release()
		}
	})

	return (
		<AbookView
			abook={
				result.data ?? throwExpression(new Error(`Unreachable code`))
			}
		/>
	)
}

const ShowAbookPage = () => {
	return (
		<PageContainer
			options={{
				title: "Abook display",
			}}
		>
			<InnerPage />
		</PageContainer>
	)
}

export default ShowAbookPage

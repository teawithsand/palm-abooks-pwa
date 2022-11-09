import { AbookList } from "@app/components/abook/list/AbookList"
import { PageContainer } from "@app/components/PageContainer"
import { useAppManager } from "@app/domain/managers/app"
import { useQuery } from "@tanstack/react-query"
import React from "react"

const InnerPage = () => {
	const app = useAppManager()

	const abooks = useQuery(["abook", "list"], async () => {
		return await app.abookDb.listAbooks()
	})
	return <AbookList abooks={abooks.data ?? []} />
}

const ListAbookPage = () => {
	return (
		<PageContainer
			options={{
				title: "Abook list",
			}}
		>
			<InnerPage />
		</PageContainer>
	)
}

export default ListAbookPage

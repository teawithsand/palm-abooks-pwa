import { AbookList } from "@app/components/abook/list/AbookList"
import { PageContainer } from "@app/components/PageContainer"
import { Abook } from "@app/domain/defines/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useSuspenseLoader } from "@app/util/useSuspenseLoader"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import { useMemo } from "react"
import { Container } from "react-bootstrap"

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

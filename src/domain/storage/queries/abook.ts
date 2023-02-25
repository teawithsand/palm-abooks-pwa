import { AbookEntity } from "@app/domain/defines/entity/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useQuery } from "@tanstack/react-query"

export const useQueryAbookById = (id: string): AbookEntity | null => {
	const app = useAppManager()
	const result = useQuery(["abook", "get", id], async () => {
		const abooks = await app.abookDb.listAbooks()
		return abooks.find((abook) => abook.id === id) ?? null
	})

	return result.data ?? null
}

export const useQueryAbookList = (): AbookEntity[] => {
	const app = useAppManager()

	const result = useQuery(["abook", "list"], async () => {
		return await app.abookDb.listAbooks()
	})

	return result.data ?? []
}

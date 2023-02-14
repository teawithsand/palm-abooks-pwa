import { AbookEntity } from "@app/domain/defines/entity/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useQuery } from "@tanstack/react-query"

export const useQueryAbookById = (id: string): AbookEntity | null => {
	const app = useAppManager()
	const result = useQuery(["abook", "get", id], async () => {
		const access = await app.abookDb.abookWriteAccess(id)
		try {
			return access.getAbook()
		} finally {
			access.release()
		}
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

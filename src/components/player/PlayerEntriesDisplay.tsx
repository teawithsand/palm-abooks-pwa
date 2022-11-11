import { useAppManager } from "@app/domain/managers/app"
import { WhatToPlayData } from "@app/domain/managers/whatToPlayManager"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"

export const usePlayerEntriesDisplayData =
	(): PlayerEntriesDisplayData | null => {
		const app = useAppManager()

		const whatToPlayData = useStickySubscribable(app.whatToPlayManager.bus)
		if (!whatToPlayData) return null

		return {
			whatToPlayData,
		}
	}

export type PlayerEntriesDisplayData = {
	whatToPlayData: WhatToPlayData
}

export type PlayerEntriesDisplayCallbacks = {
	jumpToEntry?: (id: string) => void
}

export const PlayerEntriesDisplay = (
	props: PlayerEntriesDisplayData & PlayerEntriesDisplayCallbacks
) => {
	return <></>
}

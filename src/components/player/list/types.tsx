import { useAppManager } from "@app/domain/managers/app"
import { WhatToPlayData } from "@app/domain/managers/whatToPlayManager"
import { MetadataBag } from "@teawithsand/tws-player"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import { useMemo } from "react"

export const usePlayerEntriesDisplayData =
	(): PlayerEntriesDisplayData | null => {
		const app = useAppManager()

		const whatToPlayData = useStickySubscribable(app.whatToPlayManager.bus)
		if (!whatToPlayData) return null

		const currentEntryId = useStickySubscribableSelector(
			app.playerManager.playerStateBus,
			(s) => s.innerState.config.currentSourceKey
		)

		const outerMetadataBag = useStickySubscribableSelector(
			app.whatToPlayManager.bus,
			(s) => s?.metadata
		)

		const metadataBag = useMemo(
			() => outerMetadataBag ?? new MetadataBag([]),
			[outerMetadataBag]
		)

		const currentPosition = useStickySubscribableSelector(
			app.playerManager.playerStateBus,
			(s) => s.innerState.position
		)

		return {
			whatToPlayData,
			currentEntryId,
			metadataBag,
			currentPosition,
		}
	}

export type PlayerEntriesDisplayData = {
	whatToPlayData: WhatToPlayData
	currentEntryId: string | null
	metadataBag: MetadataBag
	currentPosition: number | null
}

export type PlayerEntriesDisplayCallbacks = {
	jumpToEntry?: (id: string) => void
}

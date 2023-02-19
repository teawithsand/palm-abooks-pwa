import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { StickySubscribable } from "@teawithsand/tws-stl"

export type PlayerEntryListState = {
	id: string
	entriesBag: PlayerEntriesBag

	isLoadingMetadata: boolean
}

export interface PlayerEntryList {
	readonly id: string
	readonly stateBus: StickySubscribable<PlayerEntryListState>
}

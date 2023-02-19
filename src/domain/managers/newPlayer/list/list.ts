import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { MetadataBag } from "@teawithsand/tws-player"
import { StickySubscribable } from "@teawithsand/tws-stl"

export type PlayerEntryListState = {
	id: string
	metadataBag: MetadataBag

	entries: PlayerEntry[]
	entriesById: {
		[id: string]: PlayerEntry
	}

	isLoadingMetadata: boolean
}

export interface PlayerEntryList {
	readonly id: string
	readonly stateBus: StickySubscribable<PlayerEntryListState>
}

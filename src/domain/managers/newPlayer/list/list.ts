import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { StickySubscribable } from "@teawithsand/tws-stl"

export type PlayerEntryListState = {
	/**
	 * @deprecated lists ids are used no more.
	 */
	id: string
	entriesBag: PlayerEntriesBag

	isLoadingMetadata: boolean
}

export interface PlayerEntryList {
	/**
	 * @deprecated lists ids are used no more.
	 */
	readonly id: string
	readonly stateBus: StickySubscribable<PlayerEntryListState>
}

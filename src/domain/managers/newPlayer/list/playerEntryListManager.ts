import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { DefaultPlayerEntryList } from "@app/domain/managers/newPlayer/list/entryList"
import {
	PlayerEntryList,
	PlayerEntryListState,
} from "@app/domain/managers/newPlayer/list/list"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
} from "@teawithsand/tws-stl"
import produce from "immer"
import {
	PlayerEntryListMetadata,
	PlayerEntryListMetadataType,
} from "@app/domain/managers/newPlayer/list/metadata"

export type PlayerEntryListManagerState = {
	currentEntryId: string | null
	listState: PlayerEntryListState
	listMetadata: PlayerEntryListMetadata
}

export class PlayerEntryListManager {
	private list: PlayerEntryList = new DefaultPlayerEntryList()
	private listCanceller: SubscriptionCanceler
	private readonly innerBus =
		new DefaultStickyEventBus<PlayerEntryListManagerState>({
			currentEntryId: null,
			listState: this.list.stateBus.lastEvent,
			listMetadata: new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.UNKNOWN,
			}),
		})

	get bus(): StickySubscribable<PlayerEntryListManagerState> {
		return this.innerBus
	}

	private innerSetList = (
		list: PlayerEntryList,
		entryId: string | null = null,
		metadata: PlayerEntryListMetadata | undefined = undefined
	) => {
		this.list = list
		this.listCanceller()

		this.innerBus.emitEvent({
			currentEntryId: entryId,
			listState: list.stateBus.lastEvent,
			listMetadata: metadata ?? this.innerBus.lastEvent.listMetadata,
		})

		this.listCanceller = list.stateBus.addSubscriber((state) => {
			this.innerBus.emitEvent(
				produce(this.innerBus.lastEvent, (draft) => {
					if (
						draft.currentEntryId !== null &&
						!state.entriesBag.findById(draft.currentEntryId)
					) {
						draft.currentEntryId = null
					}
					draft.listState = state
				})
			)
		})
	}

	constructor() {
		this.listCanceller = () => {}
		this.innerSetList(new DefaultPlayerEntryList())
	}

	unsetList = () => {
		this.setList(
			new DefaultPlayerEntryList(),
			null,
			new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.UNKNOWN,
			})
		)
	}

	setList = (
		list: PlayerEntryList,
		entryId: string | null = null,
		metadata: PlayerEntryListMetadata | undefined = undefined
	) => {
		this.innerSetList(list, entryId, metadata)
	}

	goToEntry = (id: string) => {
		if (this.innerBus.lastEvent.currentEntryId !== id) {
			this.innerBus.emitEvent(
				produce(this.innerBus.lastEvent, (draft) => {
					draft.currentEntryId = id
				})
			)
		}
	}

	goToNext = () => {
		this.innerBus.emitEvent(
			produce(this.innerBus.lastEvent, (draft) => {
				draft.currentEntryId = this.getNextEntry()?.id ?? null
			})
		)
	}

	goToPrev = () => {
		this.innerBus.emitEvent(
			produce(this.innerBus.lastEvent, (draft) => {
				draft.currentEntryId = this.getPrevEntry()?.id ?? null
			})
		)
	}

	private getNextEntry = (): PlayerEntry | null => {
		const {
			listState: { entriesBag },
			currentEntryId,
		} = this.innerBus.lastEvent
		const entries = entriesBag.entries
		if (currentEntryId === null) {
			if (entries.length > 0) {
				return entries[0]
			} else {
				return null
			}
		} else {
			let i = entries.map((e) => e.id).indexOf(currentEntryId)
			if (i < 0) {
				i = 0
			}

			i++

			if (i >= entries.length) {
				return null
			}

			return entries[i]
		}
	}

	private getPrevEntry = (): PlayerEntry | null => {
		const {
			listState: { entriesBag },
			currentEntryId,
		} = this.innerBus.lastEvent
		const entries = entriesBag.entries

		if (currentEntryId === null) {
			if (entries.length > 0) {
				return entries[0]
			} else {
				return null
			}
		} else {
			let i = entries.map((e) => e.id).indexOf(currentEntryId)
			if (i < 0) {
				i = 0
			}

			i--

			if (i < 0) {
				return null
			}

			return entries[i]
		}
	}
}

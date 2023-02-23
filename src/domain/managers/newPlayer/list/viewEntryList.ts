import { DefaultPlayerEntryListState } from "@app/domain/managers/newPlayer/list/entryList"
import {
	PlayerEntryList,
	PlayerEntryListState,
} from "@app/domain/managers/newPlayer/list/list"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import {
	DefaultStickyEventBus,
	StickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
	generateUUID,
} from "@teawithsand/tws-stl"

export type ViewPlayerEntryListPredicate = (entry: PlayerEntry) => boolean

/**
 * Entry list, that wraps other entry list and only displays entries that are filtered by predicate.
 */
export class ViewPlayerEntryList implements PlayerEntryList {
	private readonly innerStateBus: StickyEventBus<DefaultPlayerEntryListState>
	private baseList: PlayerEntryList | null = null
	private baseListUnsubscribe: SubscriptionCanceler | null = null
	private predicate: ViewPlayerEntryListPredicate = () => true

	constructor(public readonly id: string = generateUUID()) {
		this.innerStateBus =
			new DefaultStickyEventBus<DefaultPlayerEntryListState>({
				id,
				entriesBag: new PlayerEntriesBag([]),
				isLoadingMetadata: false,
			})
	}

	get stateBus(): StickySubscribable<DefaultPlayerEntryListState> {
		return this.innerStateBus
	}

	private recomputeState = (state: PlayerEntryListState) => {
		const newEntries = state.entriesBag.entries.filter(this.predicate)

		this.innerStateBus.emitEvent({
			id: this.id,
			entriesBag: new PlayerEntriesBag(newEntries),
			isLoadingMetadata: state.isLoadingMetadata,
		})
	}

	setPredicate = (predicate: ViewPlayerEntryListPredicate) => {
		this.predicate = predicate

		if (this.baseList) {
			this.recomputeState(this.baseList.stateBus.lastEvent)
		}
	}

	setBaseList = (baseList: PlayerEntryList) => {
		if (this.baseListUnsubscribe) {
			this.baseListUnsubscribe()
			this.baseListUnsubscribe = null
		}

		this.baseList = baseList
		this.baseListUnsubscribe = baseList.stateBus.addSubscriber((state) => {
			this.recomputeState(state)
		})
	}
}

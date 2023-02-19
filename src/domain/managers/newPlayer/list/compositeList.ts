import {
	PlayerEntryList,
	PlayerEntryListState,
} from "@app/domain/managers/newPlayer/list/list"
import { MetadataBag } from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	StickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
	generateUUID,
} from "@teawithsand/tws-stl"

export interface CompositePlayerEntryListState extends PlayerEntryListState {
	lists: PlayerEntryList[]
}

/**
 * List of PlayerEntryList that is also a PlayerEntryList.
 */
export class CompositePlayerEntryList implements PlayerEntryList {
	private subCancelers: SubscriptionCanceler[] = []
	private readonly innerStateBus: StickyEventBus<CompositePlayerEntryListState>

	constructor(public readonly id: string = generateUUID()) {
		this.innerStateBus =
			new DefaultStickyEventBus<CompositePlayerEntryListState>({
				id,
				lists: [],
				entries: [],
				entriesById: {},
				isLoadingMetadata: false,
				metadataBag: new MetadataBag([]),
			})
	}

	get stateBus(): StickySubscribable<CompositePlayerEntryListState> {
		return this.innerStateBus
	}

	insertList = (list: PlayerEntryList, i?: number) => {
		const lists = [...this.innerStateBus.lastEvent.lists]
		i = i ?? lists.length

		lists.splice(i, 0, list)
		this.subCancelers.splice(
			i,
			0,
			list.stateBus.addSubscriber(this.subscriber)
		)
	}

	private readonly subscriber = () => {
		this.innerStateBus.emitEvent({
			...this.computeStateUsingLists(this.innerStateBus.lastEvent.lists),
			lists: this.innerStateBus.lastEvent.lists,
		})
	}

	// TODO(teawithsand): methods for more efficient list management

	setLists = (lists: PlayerEntryList[]) => {
		for (const sc of this.subCancelers) sc()
		this.subCancelers = []

		lists = [...lists]
		this.innerStateBus.emitEvent({
			...this.computeStateUsingLists(lists),
			lists,
		})

		this.subCancelers = lists.map((l) =>
			l.stateBus.addSubscriber(this.subscriber)
		)
	}

	private computeStateUsingLists = (
		lists: PlayerEntryList[]
	): PlayerEntryListState => {
		const entries = lists.flatMap((v) => v.stateBus.lastEvent.entries)
		const results = lists.flatMap(
			(v) => v.stateBus.lastEvent.metadataBag.results
		)

		const metadataBag = new MetadataBag(results)
		const isLoadingMetadata = lists.some(
			(v) => v.stateBus.lastEvent.isLoadingMetadata
		)

		const entryIdTuples = entries.map((v) => [v.id, v])

		return {
			entries,
			metadataBag,
			isLoadingMetadata,
			entriesById: Object.fromEntries(entryIdTuples),
			id: this.id,
		}
	}
}

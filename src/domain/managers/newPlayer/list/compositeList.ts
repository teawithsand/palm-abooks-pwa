import {
	PlayerEntryList,
	PlayerEntryListState,
} from "@app/domain/managers/newPlayer/list/list"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
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
				entriesBag: new PlayerEntriesBag([]),
				isLoadingMetadata: false,
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
		const entries = lists.flatMap(
			(v) => v.stateBus.lastEvent.entriesBag.entries
		)

		const isLoadingMetadata = lists.some(
			(v) => v.stateBus.lastEvent.isLoadingMetadata
		)
		
		return {
			entriesBag: new PlayerEntriesBag(entries),
			isLoadingMetadata,
			id: this.id,
		}
	}
}

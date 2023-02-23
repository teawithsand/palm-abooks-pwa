import { SimplePlayerEntryList } from "@app/domain/managers/newPlayer/list/entryList"
import {
	PlayerEntryList,
	PlayerEntryListState,
} from "@app/domain/managers/newPlayer/list/list"
import {
	PlayerEntryListMetadata,
	PlayerEntryListMetadataType,
} from "@app/domain/managers/newPlayer/list/metadata"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export type PlayerEntryListManagerLists = {
	/**
	 * List of all entries. Queried for other non-playable stuff like cover images.
	 *
	 * It contains all entries of playerListState.
	 */
	full: PlayerEntryList
	/**
	 * List of entries that are available to player. This one is queried when requesting playable entry by id.
	 *
	 * Also, for UI reasons, currentEntryId should be valid in this list.
	 */
	player: PlayerEntryList

	/**
	 * List of playable entries that are presented to user. This one is queried when requesting stuff like
	 * user-visible playlist.
	 *
	 * It must be sub-list of playerListState. Player must be able to reach all playable entries.
	 */
	presentation: PlayerEntryList
}

export type PlayerEntryListManagerListStates = {
	[key in keyof PlayerEntryListManagerLists]: PlayerEntryListState
}

export type PlayerEntryListManagerState = {
	/**
	 * Id of currently played entry. It has to point somewhere to playerListState or be null.
	 */
	currentEntryId: string | null

	/**
	 * Lists for direct access, in case it's needed.
	 *
	 * Do NOT subscribe to their busses directly! Use states instead.
	 */
	lists: PlayerEntryListManagerLists
	states: PlayerEntryListManagerListStates

	/**
	 * @deprecated use lists.player instead.
	 */
	listState: PlayerEntryListState

	/**
	 * List metadata. Same for all lists. It's more about playback, less about entries.
	 */
	listMetadata: PlayerEntryListMetadata
}

const listsToStates = (
	lists: PlayerEntryListManagerLists
): PlayerEntryListManagerListStates => ({
	full: lists.full.stateBus.lastEvent,
	player: lists.player.stateBus.lastEvent,
	presentation: lists.presentation.stateBus.lastEvent,
})

export class PlayerEntryListManager {
	private lists: PlayerEntryListManagerLists = {
		full: new SimplePlayerEntryList(),
		player: new SimplePlayerEntryList(),
		presentation: new SimplePlayerEntryList(),
	}

	private listSubscriptionCancelers: SubscriptionCanceler[] = []

	private readonly innerBus =
		new DefaultStickyEventBus<PlayerEntryListManagerState>({
			currentEntryId: null,
			lists: this.lists,
			states: listsToStates(this.lists),
			listState: listsToStates(this.lists).player,
			listMetadata: new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.UNKNOWN,
			}),
		})

	get bus(): StickySubscribable<PlayerEntryListManagerState> {
		return this.innerBus
	}

	/**
	 *
	 * @param lists
	 * @param entryId
	 * @param metadata Optional. Leaves one set before if unset.
	 */
	private innerSetLists = (
		lists: PlayerEntryListManagerLists,
		entryId: string | null = null,
		metadata?: PlayerEntryListMetadata
	) => {
		this.listSubscriptionCancelers.forEach((c) => c())

		const updateState = (
			callback: (draft: Draft<PlayerEntryListManagerState>) => void
		) => {
			this.innerBus.emitEvent(
				produce(this.innerBus.lastEvent, (draft) => {
					callback(draft)
					draft.listState = draft.states.player

					// Do not allow current entry id to be removed from player list.
					// In that case stop playing it.
					const currentId = draft.currentEntryId
					if (
						currentId !== null &&
						!draft.states.player.entriesBag.findById(currentId)
					) {
						draft.currentEntryId = null
					}
				})
			)
		}

		updateState((draft) => {
			draft.currentEntryId = entryId
			draft.lists = lists
			draft.states = listsToStates(lists)
			draft.listMetadata = metadata ?? draft.listMetadata
		})

		for (const [k, v] of Object.entries(lists)) {
			v.stateBus.addSubscriber((state) => {
				updateState((draft) => {
					// This is fine due to definition of states used
					// still this is unsound, but requires less code
					;(draft.states as any)[k] = state
				})
			})
		}
	}

	constructor() {}

	unsetLists = () => {
		this.setLists(
			{
				full: new SimplePlayerEntryList(),
				player: new SimplePlayerEntryList(),
				presentation: new SimplePlayerEntryList(),
			},
			null,
			new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.UNKNOWN,
			})
		)
	}
	/**
	 * @deprecated use unsetLists instead
	 */
	unsetList = this.unsetLists

	/**
	 * Sets lists to use.
	 *
	 * Also capable of setting metadata and currentEntryId.
	 */
	setLists = (
		lists: PlayerEntryListManagerLists,
		entryId: string | null = null,
		metadata?: PlayerEntryListMetadata
	) => {
		this.innerSetLists(lists, entryId, metadata)
	}

	setMetadata = (metadata: PlayerEntryListMetadata) => {
		this.innerBus.emitEvent(
			produce(this.innerBus.lastEvent, (draft) => {
				draft.listMetadata = metadata
			})
		)
	}

	/**
	 * HACK(teawithsand): used to navigate to entry with given id.
	 *
	 * Used in SeekQueue as player is not capable of changing current source on it's own.
	 * This shall be fixed in future.
	 *
	 * @deprecated Do not use outside SeekQueue. Refactor this in future.
	 */
	goToEntry = (id: string) => {
		if (this.innerBus.lastEvent.currentEntryId === id) return // ignore noop

		this.innerBus.emitEvent(
			produce(this.innerBus.lastEvent, (draft) => {
				if (!draft.states.player.entriesBag.findById(id)) {
					draft.currentEntryId = null
				} else {
					draft.currentEntryId = id
				}
			})
		)
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
			states: {
				player: { entriesBag },
			},
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
			states: {
				player: { entriesBag },
			},
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

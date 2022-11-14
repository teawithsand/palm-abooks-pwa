import { Abook } from "@app/domain/defines/abook"
import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import { MetadataLoadHelper } from "@app/domain/managers/metadataHelper"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { MetadataBag } from "@teawithsand/tws-player"
import {
	DefaultEventBus,
	DefaultStickyEventBus,
	StickySubscribable,
} from "@teawithsand/tws-stl"
import { Unsubscribe } from "final-form"
import produce from "immer"

export enum WhatToPlayDataType {
	ABOOK = 1,
	USER_PROVIDED_ENTRIES = 2,
}

export type WhatToPlayData = {
	/**
	 * @deprecated use entries bag instead
	 */
	entries: PlayableEntry[]
	entriesBag: PlayableEntriesBag
	metadata: MetadataBag
} & (
	| {
			type: WhatToPlayDataType.ABOOK
			abook: Abook
	  }
	| {
			type: WhatToPlayDataType.USER_PROVIDED_ENTRIES
			userProvidedEntries: PlayableEntry[]
	  }
)

export class WhatToPlayManager {
	// TODO(teawithsand): make this manager responsible for metadata loading + storing
	//  once it was loaded for abook or some other target
	//  for now storing can be omitted as we load metadata while adding files

	constructor(private readonly metadataHelper: MetadataLoadHelper) {}

	private innerBus: DefaultStickyEventBus<WhatToPlayData | null> =
		new DefaultStickyEventBus(null)

	get bus(): StickySubscribable<WhatToPlayData | null> {
		return this.innerBus
	}

	private currentWhatToPlayDataTemplate: WhatToPlayData | null = null

	private cancelBus = new DefaultEventBus<undefined>()

	unset = () => {
		this.currentWhatToPlayDataTemplate = null
		this.innerBus.emitEvent(null)
	}

	private setTemplate = (data: WhatToPlayData) => {
		this.currentWhatToPlayDataTemplate = data

		const loading = this.metadataHelper.makeLoading(data.entries)
		data.metadata = loading.bus.lastEvent.bag

		this.innerBus.emitEvent(this.currentWhatToPlayDataTemplate)
		let cancelled = false

		// TODO(teawithsand): implement cancelling if source gets changed
		loading.bus.addSubscriber((state) => {
			if (cancelled) return
			if (this.currentWhatToPlayDataTemplate === data) {
				this.innerBus.emitEvent(
					produce(this.currentWhatToPlayDataTemplate, (draft) => {
						draft.metadata = state.bag
					})
				)
			}
		})

		let cancelSub: Unsubscribe | null = null
		cancelSub = this.cancelBus.addSubscriber(() => {
			loading.cancel()
			cancelled = true
			if (cancelSub) {
				cancelSub()
				cancelSub = null
			}
		})
	}

	setAbook = (abook: Abook) => {
		this.cancelBus.emitEvent(undefined)

		const musicEntries = abook.entries.filter(
			(e) => getFileEntryDisposition(e) === FileEntryDisposition.MUSIC
		)

		const entries: PlayableEntry[] = musicEntries.map((e) => ({
			type: PlayableEntryType.FILE_ENTRY,
			entry: e,
			id: e.id,
		}))

		this.setTemplate({
			type: WhatToPlayDataType.ABOOK,
			abook,
			metadata: new MetadataBag(
				musicEntries.map((e) => e.metadata.musicMetadata)
			),
			entries,
			entriesBag: new PlayableEntriesBag(entries),
		})
	}
}

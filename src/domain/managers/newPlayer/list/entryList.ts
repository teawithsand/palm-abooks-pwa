import {
	PlayerEntryList,
	PlayerEntryListState,
} from "@app/domain/managers/newPlayer/list/list"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { loadMetadataToResultHack } from "@app/util/metadataLoadingResult"
import { zip } from "@app/util/zip"
import {
	DefaultMetadataLoader,
	MetadataBag,
	MetadataLoader,
	MetadataLoadingResult,
} from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	DefaultTaskAtom,
	StickyEventBus,
	StickySubscribable,
	generateUUID,
} from "@teawithsand/tws-stl"

export interface DefaultPlayerEntryListState extends PlayerEntryListState {}

export class DefaultPlayerEntryList implements PlayerEntryList {
	private readonly innerStateBus: StickyEventBus<DefaultPlayerEntryListState>
	private readonly taskAtom = new DefaultTaskAtom()

	constructor(
		public readonly id: string = generateUUID(),
		private readonly loader: MetadataLoader = new DefaultMetadataLoader()
	) {
		this.innerStateBus =
			new DefaultStickyEventBus<DefaultPlayerEntryListState>({
				id,
				entries: [],
				entriesById: {},
				isLoadingMetadata: false,
				metadataBag: new MetadataBag([]),
			})
	}

	get stateBus(): StickySubscribable<DefaultPlayerEntryListState> {
		return this.innerStateBus
	}

	setEntries = (entries: PlayerEntry[]) => {
		entries = [...entries]
		const claim = this.taskAtom.claim()

		const results: (MetadataLoadingResult | null)[] = []
		for (const entry of entries) {
			results.push(entry.metadata)
		}

		let isLoading = true
		const emitUpdate = () => {
			if (!claim.isValid) return

			this.innerStateBus.emitEvent({
				id: this.id,
				entries: entries,
				entriesById: Object.fromEntries(entries.map((v) => [v.id, v])),
				isLoadingMetadata: isLoading,
				metadataBag: new MetadataBag([...results]),
			})
		}

		const runLoading = async () => {
			let i = 0
			for (const [entry, preloadedResult] of zip(entries, [...results])) {
				if (!claim.isValid) return
				if (!preloadedResult) {
					results[i] = await loadMetadataToResultHack(
						this.loader,
						entry.source
					)

					entries[i] = entry.withLoadedMetadata(results[i])
					emitUpdate()
				}
				i++
			}
		}

		const runLoadingWrapper = async () => {
			try {
				await runLoading()
			} finally {
				isLoading = false
			}

			emitUpdate()
		}

		runLoadingWrapper()
	}
}

import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import {
	DefaultMetadataLoader,
	MetadataBag,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "@teawithsand/tws-player"
import { DefaultStickyEventBus, StickySubscribable } from "@teawithsand/tws-stl"

export class MetadataLoadHelper {
	private readonly metadataLoader: DefaultMetadataLoader<PlayableEntry>
	constructor(
		private readonly sourceResolver: PlayableEntryPlayerSourceResolver
	) {
		this.metadataLoader = new DefaultMetadataLoader(this.sourceResolver)
	}

	makeLoading = (entries: PlayableEntry[]): MetadataLoading => {
		const bag = new MetadataBag(
			entries.map((v) => {
				if (v.type === PlayableEntryType.FILE_ENTRY)
					return v.entry.musicMetadataLoadingResult
				return null
			})
		)

		return new MetadataLoading(bag, entries, this.metadataLoader)
	}
}

export class MetadataLoading {
	private isCancelledInner = false

	private readonly innerBus: DefaultStickyEventBus<{
		bag: MetadataBag
		doneEntries: number
		done: boolean
	}>

	constructor(
		private bag: MetadataBag,
		private readonly entries: PlayableEntry[],
		private readonly loader: DefaultMetadataLoader<PlayableEntry>
	) {
		this.innerBus = new DefaultStickyEventBus<{
			bag: MetadataBag
			doneEntries: number
			done: boolean
		}>({
			bag: this.bag,
			doneEntries: 0,
			done: false,
		})

		this.init()
	}
	get bus(): StickySubscribable<{
		bag: MetadataBag
		doneEntries: number
	}> {
		return this.innerBus
	}
	get isCanceled() {
		return this.isCancelledInner
	}

	cancel = () => {
		this.isCancelledInner = true
	}

	private init() {
		;(async () => {
			let i = 0
			for (const e of this.entries) {
				try {
					if (this.isCanceled) {
						this.innerBus.emitEvent({
							bag: this.bag,
							doneEntries: i,
							done: true,
						})
						return
					}

					let result: MetadataLoadingResult | null =
						this.bag.getResult(i)
					if (!result) {
						try {
							const metadata = await this.loader.loadMetadata(e)
							result = {
								type: MetadataLoadingResultType.OK,
								metadata,
							}
						} catch (e) {
							result = {
								type: MetadataLoadingResultType.ERROR,
								error: String(e),
							}
						}
					}

					const results: (MetadataLoadingResult | null)[] = [
						...new Array(this.bag.length).keys(),
					].map((k) => this.bag.getResult(k))

					results[i] = result
					this.bag = new MetadataBag(results)

					this.innerBus.emitEvent({
						bag: this.bag,
						doneEntries: i + 1,
						done: false,
					})
				} finally {
					i++
				}
			}

			this.innerBus.emitEvent({
				bag: this.bag,
				doneEntries: this.bag.length,
				done: true,
			})
		})()
	}
}

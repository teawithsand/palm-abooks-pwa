import { FileEntryEntityPlayerSource } from "@app/domain/managers/newPlayer/source/source"
import {
	MetadataLoadingResult,
	PlayerSource,
	StaticPlayerSource,
	UrlPlayerSource,
} from "@teawithsand/tws-player"
import { generateUUID } from "@teawithsand/tws-stl"

export class PlayerEntry {
	constructor(
		public readonly source: PlayerSource,
		public readonly loadedMetadata: MetadataLoadingResult | null = null,
		public readonly id = generateUUID()
	) {}

	withLoadedMetadata = (res: MetadataLoadingResult | null): PlayerEntry => {
		return new PlayerEntry(this.source, res, this.id)
	}

	/**
	 * Final metadata of PlayerEntry, no matter if it's loaded or cached already.
	 */
	get metadata(): MetadataLoadingResult | null {
		if (this.loadedMetadata !== null) return this.loadedMetadata

		if (this.source instanceof FileEntryEntityPlayerSource) {
			return this.source.entry.musicMetadataLoadingResult
		}

		return null
	}

	get displayName(): string {
		if (this.source instanceof FileEntryEntityPlayerSource) {
			return this.source.entry.name
		}

		if (this.source instanceof UrlPlayerSource) {
			return this.source.url
		}

		if (this.source instanceof StaticPlayerSource) {
			if (this.source.asset instanceof File) {
				return `File: ${this.source.asset.name}`
			} else if (typeof this.source.asset === "string") {
				return this.source.asset
			}
		}

		return `Unknown #${this.id}`
	}
}
import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import { FileEntryEntityPlayerSource } from "@app/domain/managers/newPlayer/source/source"
import { guessDisposition } from "@app/domain/storage/disposition"
import {
	MetadataLoadingResult,
	MetadataLoadingResultType,
	PlayerSource,
	StaticPlayerSource,
	UrlPlayerSource,
} from "@teawithsand/tws-player"
import { generateUUID } from "@teawithsand/tws-stl"

export type PlayerEntryOverrides = {
	loadedMetadata?: MetadataLoadingResult | null
	disposition?: FileEntryDisposition | null
}

export class PlayerEntry {
	constructor(
		public readonly source: PlayerSource,
		public readonly id = generateUUID(),
		public readonly overrides: PlayerEntryOverrides = {}
	) {}

	withOverrides = (overrides: PlayerEntryOverrides): PlayerEntry => {
		return new PlayerEntry(this.source, this.id, overrides)
	}

	withLoadedMetadata = (
		loadedMetadata: MetadataLoadingResult | null
	): PlayerEntry =>
		this.withOverrides({
			...this.overrides,
			loadedMetadata,
		})

	withDisposition = (disposition: FileEntryDisposition) =>
		this.withOverrides({
			...this.overrides,
			disposition,
		})

	get disposition(): FileEntryDisposition {
		if (this.overrides.disposition) return this.overrides.disposition

		if (this.source instanceof FileEntryEntityPlayerSource) {
			return this.source.entry.dispositionOrGuess
		}

		if (this.source instanceof UrlPlayerSource) {
			return guessDisposition({
				url: this.source.url,
			})
		}

		if (this.source instanceof StaticPlayerSource) {
			const { asset } = this.source
			if (typeof asset === "string") {
				return guessDisposition({
					url: asset,
				})
			} else {
				return guessDisposition({
					mime: asset.type,
					name: asset instanceof File ? asset.name : "",
				})
			}
		}

		return FileEntryDisposition.UNKNOWN
	}

	/**
	 * Metadata that was loaded. To allow cached versions use metadata instead.
	 */
	get loadedMetadata(): MetadataLoadingResult | null {
		return this.overrides.loadedMetadata ?? null
	}

	get duration(): number | null {
		const metadata = this.metadata
		if (metadata && metadata.type === MetadataLoadingResultType.OK) {
			return metadata.metadata.duration
		}
		return null
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

	/**
	 * Returns file name of given PlayerEntry, if any.
	 *
	 * Used for loading position by fileName.
	 */
	get fileName(): string | null {
		if (this.source instanceof FileEntryEntityPlayerSource) {
			return this.source.entry.name
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

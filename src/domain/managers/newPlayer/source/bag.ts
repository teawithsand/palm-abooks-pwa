import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import {
	AbsoluteSeekData,
	SeekType,
	TrivialSeekData,
} from "@app/domain/defines/seek"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { FileEntryEntityPlayerSource } from "@app/domain/managers/newPlayer/source/source"
import { MetadataBag, MetadataLoadingResultType } from "@teawithsand/tws-player"

export class PlayerEntriesBag {
	public readonly metadataBag: MetadataBag
	constructor(public readonly entries: PlayerEntry[]) {
		this.entries = [...entries]
		const metadata = entries.map((e) => e.metadata)
		this.metadataBag = new MetadataBag(metadata)
	}

	get length() {
		return this.entries.length
	}

	get isEmpty() {
		return this.entries.length === 0
	}

	/**
	 * Finds first source, which has is FileEntryEntityPlayerSource and has id equal to given one.
	 */
	findByFileEntryEntityId = (id: string): PlayerEntry | null => {
		return (
			this.entries.find((e) => {
				if (e.source instanceof FileEntryEntityPlayerSource) {
					return e.source.entry.id === id
				}
				return false
			}) ?? null
		)
	}

	findByIndex = (i: number): PlayerEntry | null => this.entries[i] ?? null
	findById = (id: string): PlayerEntry | null =>
		this.entries.find((e) => e.id === id) ?? null
	findIndexById = (id: string): number | null => {
		const i = this.entries.findIndex((e) => e.id === id)
		if (i < 0) return null
		return i
	}

	findFirstEntryWithDisposition = (
		disposition: FileEntryDisposition
	): PlayerEntry | null =>
		this.entries.find((e) => e.disposition === disposition) ?? null

	resolveAbsoluteSeek = (
		seekData: AbsoluteSeekData
	): TrivialSeekData | null => {
		if (seekData.type === SeekType.ABSOLUTE_GLOBAL) {
			let index = this.metadataBag.getIndexFromPosition(
				seekData.positionMs
			)
			if (index === null) return null
			let position = seekData.positionMs
			const duration = this.metadataBag.getDurationToIndex(index)
			if (duration === null) return null

			// cap result if position is after the end
			if (index >= this.metadataBag.length) {
				index = this.metadataBag.length - 1

				const res = this.metadataBag.results[index]
				if (
					res &&
					res.type === MetadataLoadingResultType.OK &&
					res.metadata.duration !== null
				) {
					position = res.metadata.duration
				} else {
					return null
				}
			}

			return {
				playerEntryId: this.entries[index].id,
				positionMs: seekData.positionMs - duration,
			}
		} else if (seekData.type === SeekType.ABSOLUTE_IN_FILE) {
			return {
				playerEntryId: null,
				positionMs: seekData.positionMs,
			}
		} else if (seekData.type === SeekType.ABSOLUTE_TO_FILE) {
			return {
				playerEntryId: seekData.playerEntryId,
				positionMs: seekData.positionMs,
			}
		} else {
			throw new Error("Unreachable code")
		}
	}
}

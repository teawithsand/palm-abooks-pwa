import {
	AbsoluteSeekData,
	SeekType,
	TrivialSeekData,
} from "@app/domain/defines/seek"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { MetadataBag } from "@teawithsand/tws-player"

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

	findByIndex = (i: number): PlayerEntry | null => this.entries[i] ?? null
	findById = (id: string): PlayerEntry | null =>
		this.entries.find((e) => e.id === id) ?? null
	findIndexById = (id: string): number | null => {
		const i = this.entries.findIndex((e) => e.id === id)
		if (i < 0) return null
		return i
	}

	resolveAbsoluteSeek = (
		seekData: AbsoluteSeekData
	): TrivialSeekData | null => {
		if (seekData.type === SeekType.ABSOLUTE_GLOBAL) {
			const index = this.metadataBag.getIndexFromPosition(
				seekData.positionMs
			)
			if (index === null) return null

			return {
				playerEntryId: this.entries[index].id,
				positionMs: seekData.positionMs,
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

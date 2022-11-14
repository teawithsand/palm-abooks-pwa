import { PlayableEntry } from "@app/domain/defines/player/playableEntry"

export class PlayableEntriesBag {
	constructor(public readonly entries: PlayableEntry[]) {
	}

	get length() {
		return this.entries.length
	}

	get isEmpty() {
		return this.entries.length === 0
	}

	findByIndex = (i: number): PlayableEntry | null => this.entries[i] ?? null
	findById = (id: string): PlayableEntry | null =>
		this.entries.find((e) => e.id === id) ?? null
	findIndexById = (id: string): number | null => {
		const i = this.entries.findIndex((e) => e.id === id)
		if (i < 0) return null
		return i
	}
}

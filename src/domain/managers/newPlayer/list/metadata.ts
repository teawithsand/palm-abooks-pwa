import { AbookEntity } from "@app/domain/defines/entity/abook"
import { PositionVariants } from "@app/domain/defines/position"
import { TimestampMs, generateUUID } from "@teawithsand/tws-stl"

export enum PlayerEntryListMetadataType {
	ABOOK = 1,
	UNKNOWN = 2,
	LOCAL_FILES = 3,
}

/**
 * Metadata attached to any kind of list.
 */
export type PlayerEntryListMetadataData =
	| {
			type: PlayerEntryListMetadataType.ABOOK
			abook: AbookEntity
	  }
	| {
			type: PlayerEntryListMetadataType.UNKNOWN // Anything else I guess
	  }
	| {
			type: PlayerEntryListMetadataType.LOCAL_FILES // files are not included here; they are entries.
	  }

export class PlayerEntryListMetadata {
	constructor(
		public readonly data: PlayerEntryListMetadataData,
		public readonly id = generateUUID()
	) {}

	get positionToLoad(): PositionVariants | null {
		if (this.data.type === PlayerEntryListMetadataType.ABOOK) {
			return this.data.abook.position?.variants ?? null
		}

		return null
	}

	get lastPlayedTimestamp(): TimestampMs | null {
		if (this.data.type === PlayerEntryListMetadataType.ABOOK) {
			return this.data.abook.position?.savedTimestamp ?? null
		}

		return null
	}
}

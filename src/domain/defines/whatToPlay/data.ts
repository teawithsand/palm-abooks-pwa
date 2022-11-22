import { Abook } from "@app/domain/defines/abook"
import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { MetadataBag } from "@teawithsand/tws-player"

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
	  }
)

import { Abook } from "@app/domain/defines/abook"
import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { PositionVariants, SavedPositionVariants } from "@app/domain/defines/position"
import { WhatToPlayLocator } from "@app/domain/defines/whatToPlay/locator"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { MetadataBag } from "@teawithsand/tws-player"

export enum WhatToPlayDataType {
	ABOOK = 1,
	USER_PROVIDED_ENTRIES = 2,
}

// TODO(teawithsand): make this type contain playerSourceProvider
export type WhatToPlayData = {
	id: string

	/**
	 * @deprecated use entries bag instead
	 */
	entries: PlayableEntry[]
	entriesBag: PlayableEntriesBag
	metadata: MetadataBag
	locator: WhatToPlayLocator
	positionToLoad: SavedPositionVariants | null
} & (
	| {
			type: WhatToPlayDataType.ABOOK
			abook: Abook
	  }
	| {
			type: WhatToPlayDataType.USER_PROVIDED_ENTRIES
	  }
)

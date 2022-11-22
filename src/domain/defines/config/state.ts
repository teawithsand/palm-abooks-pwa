import { AbookId } from "@app/domain/defines/abook"
import {
	WhatToPlayLocator,
	WhatToPlayLocatorType,
} from "@app/domain/defines/whatToPlay/locator"

export enum LastPlayedSourceType {
	ABOOK_ID = 1,
}

export type LastPlayedSource = {
	type: LastPlayedSourceType.ABOOK_ID
	id: AbookId
}

export const lastPlayedSourceToWhatToPlaySourceLocator = (
	source: LastPlayedSource
): WhatToPlayLocator => {
	if (source.type === LastPlayedSourceType.ABOOK_ID) {
		return {
			type: WhatToPlayLocatorType.ABOOK_ID,
			id: source.id,
		}
	} else {
		throw new Error(`Invalid LPS type ${source}`)
	}
}

export const whatToPlaySourceLocatorToLastPlayedSource = (
	locator: WhatToPlayLocator
): LastPlayedSource | null => {
	if (locator.type === WhatToPlayLocatorType.ABOOK) {
		return {
			type: LastPlayedSourceType.ABOOK_ID,
			id: locator.abook.id,
		}
	} else if (locator.type === WhatToPlayLocatorType.ABOOK_ID) {
		return {
			type: LastPlayedSourceType.ABOOK_ID,
			id: locator.id,
		}
	} else {
		return null
	}
}

export type PersistentGlobalPlayerState = {
	lastPlayed: LastPlayedSource | null
}

export const INIT_PERSISTENT_GLOBAL_PLAYER_STATE: PersistentGlobalPlayerState =
	{
		lastPlayed: null,
	}

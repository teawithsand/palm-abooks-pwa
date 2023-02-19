import { AbookId } from "@app/domain/defines/abook"
import { AbookEntity } from "@app/domain/defines/entity/abook"

/**
 * @deprecated Just like What-To-Play stuff
 */
export enum WhatToPlayLocatorType {
	ABOOK = 1,
	ABOOK_ID = 2,
	RAW_ENTRIES = 3,
}

/**
 * @deprecated Just like What-To-Play stuff
 */
export type WhatToPlayLocator =
	| {
			type: WhatToPlayLocatorType.ABOOK
			abook: AbookEntity
	  }
	| {
			type: WhatToPlayLocatorType.ABOOK_ID
			id: AbookId
	  }
	| {
			type: WhatToPlayLocatorType.RAW_ENTRIES
			files: (Blob | File | string)[] // string for urls
	  }

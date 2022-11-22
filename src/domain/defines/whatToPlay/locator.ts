import { Abook, AbookId } from "@app/domain/defines/abook"

export enum WhatToPlayLocatorType {
	ABOOK = 1,
	ABOOK_ID = 2,
	RAW_ENTRIES = 3,
}

export type WhatToPlayLocator =
	| {
			type: WhatToPlayLocatorType.ABOOK
			abook: Abook
	  }
	| {
			type: WhatToPlayLocatorType.ABOOK_ID
			id: AbookId
	  }
	| {
			type: WhatToPlayLocatorType.RAW_ENTRIES
			files: (Blob | File | string)[] // string for urls
	  }

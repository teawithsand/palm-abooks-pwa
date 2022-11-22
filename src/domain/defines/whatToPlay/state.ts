import { WhatToPlayData } from "@app/domain/defines/whatToPlay/data"
import { WhatToPlayLocator } from "@app/domain/defines/whatToPlay/locator"

export enum WhatToPlayStateType {
	IDLE = 0,
	LOADING = 1,
	LOADED = 2,
	ERROR = 3,
}

export type WhatToPlayState =
	| {
			type: WhatToPlayStateType.IDLE
	  }
	| {
			type: WhatToPlayStateType.LOADING
            locator: WhatToPlayLocator
	  }
	| {
			type: WhatToPlayStateType.LOADED
            locator: WhatToPlayLocator
            data: WhatToPlayData
	  }
	| {
			type: WhatToPlayStateType.ERROR
            locator: WhatToPlayLocator
            error: any
	  }

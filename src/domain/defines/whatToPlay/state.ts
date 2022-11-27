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
	| ({
			locator: WhatToPlayLocator
	  } & (
			| {
					type: WhatToPlayStateType.LOADING
			  }
			| {
					type: WhatToPlayStateType.LOADED
					data: WhatToPlayData
			  }
			| {
					type: WhatToPlayStateType.ERROR
					error: any
			  }
	  ))

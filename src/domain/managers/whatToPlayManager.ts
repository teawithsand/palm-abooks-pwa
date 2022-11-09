import { Abook } from "@app/domain/defines/abook"
import { FileEntry } from "@app/domain/defines/abookFile"
import { DefaultStickyEventBus, StickySubscribable } from "@teawithsand/tws-stl"

export enum WhatToPlayDataType {
	ABOOK = 1,
	USER_PROVIDED_ENTRIES = 2,
}

export type WhatToPlayData =
	| {
			type: WhatToPlayDataType.ABOOK
			abook: Abook
	  }
	| {
			type: WhatToPlayDataType.USER_PROVIDED_ENTRIES
			entires: FileEntry[]
	  }

export class WhatToPlayManager {
	private innerBus: DefaultStickyEventBus<WhatToPlayData | null> =
		new DefaultStickyEventBus(null)

	get bus(): StickySubscribable<WhatToPlayData | null> {
		return this.innerBus
	}

	unset = () => {
		this.innerBus.emitEvent(null)
	}

	setAbook = (abook: Abook) => {
		this.innerBus.emitEvent({
			type: WhatToPlayDataType.ABOOK,
			abook,
		})
	}

	constructor() {}
}

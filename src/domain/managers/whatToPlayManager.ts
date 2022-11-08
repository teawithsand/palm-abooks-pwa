import { Abook } from "@app/domain/defines/abook"
import {
	DefaultStickyEventBus,
	StickyEventBus,
	StickySubscribable,
} from "@teawithsand/tws-stl"

export enum WhatToPlayDataType {
	ABOOK = 1,
}

export type WhatToPlayData = {
	type: WhatToPlayDataType.ABOOK
	abook: Abook
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

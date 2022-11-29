import { WhatToPlayData } from "@app/domain/defines/whatToPlay/data"
import { WhatToPlayLocator } from "@app/domain/defines/whatToPlay/locator"
import {
	WhatToPlayState,
	WhatToPlayStateType,
} from "@app/domain/defines/whatToPlay/state"
import { MetadataLoadHelper } from "@app/domain/managers/metadataHelper"
import { WhatToPlayLocatorResolver } from "@app/domain/managers/whatToPlay/whatToPlayLocatorResolver"
import {
	DefaultStickyEventBus,
	DefaultTaskAtom,
	StickySubscribable,
	throwExpression,
} from "@teawithsand/tws-stl"
import produce from "immer"

export class WhatToPlayManager {
	private innerStateBus: DefaultStickyEventBus<WhatToPlayState> =
		new DefaultStickyEventBus({
			type: WhatToPlayStateType.IDLE,
		})

	private innerSimpleBus: DefaultStickyEventBus<WhatToPlayData | null> =
		new DefaultStickyEventBus(null)

	get stateBus(): StickySubscribable<WhatToPlayState> {
		return this.innerStateBus
	}

	/**
	 * @deprecated Now full bus should be used.
	 */
	get bus(): StickySubscribable<WhatToPlayData | null> {
		return this.innerSimpleBus
	}

	constructor(
		private readonly metadataHelper: MetadataLoadHelper,
		private readonly resolver: WhatToPlayLocatorResolver
	) {
		this.innerStateBus.addSubscriber((s) => {
			this.innerSimpleBus.emitEvent(
				s.type === WhatToPlayStateType.LOADED ? s.data : null
			)
		})
	}

	private readonly atom = new DefaultTaskAtom()

	public setLocator = (locator: WhatToPlayLocator | null) => {
		const claim = this.atom.claim()

		const pubIfValid = (v: WhatToPlayState) => {
			if (claim.isValid) this.innerStateBus.emitEvent(v)
		}
		if (locator === null) {
			pubIfValid({
				type: WhatToPlayStateType.IDLE,
			})
			return
		}

		pubIfValid({
			type: WhatToPlayStateType.LOADING,
			locator,
		})
		;(async () => {
			let isError = false
			let e = null
			let data: WhatToPlayData | null = null
			try {
				data = await this.resolver.resolveLocator(locator)
			} catch (err) {
				isError = true
				e = err
			}

			if (isError) {
				pubIfValid({
					type: WhatToPlayStateType.ERROR,
					error: e,
					locator,
				})
			} else {
				const state: WhatToPlayState & {
					type: WhatToPlayStateType.LOADED
				} = {
					type: WhatToPlayStateType.LOADED,
					data:
						data ?? throwExpression(new Error("Unreachable code")),
					locator,
				}
				pubIfValid(state)

				const loading = this.metadataHelper.makeLoading(
					state.data.entriesBag.entries
				)
				claim.addCleaner(() => loading.cancel())

				loading.bus.addSubscriber((res) => {
					state.data = produce(state.data, (draft) => {
						draft.metadata = res.bag
					})
					pubIfValid(state)
				})
			}
		})()
	}
}

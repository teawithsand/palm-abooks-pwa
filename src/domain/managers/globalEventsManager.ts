import { DefaultEventBus, Subscribable } from "@teawithsand/tws-stl"

export enum GlobalEventType {
	WINDOW_BLUR = 1,
}

export type GlobalEvent = {
	type: GlobalEventType
}

export class GlobalEventsManager {
	private readonly innerBus = new DefaultEventBus<GlobalEvent>()

	get bus(): Subscribable<GlobalEvent> {
		return this.innerBus
	}

	constructor() {
		window.addEventListener("blur", () => {
			this.innerBus.emitEvent({
				type: GlobalEventType.WINDOW_BLUR,
			})
		})
	}
}

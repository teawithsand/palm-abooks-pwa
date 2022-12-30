import list from "@app/pages/abook/list"
import {
	DefaultEventBus,
	DefaultStickyEventBus,
	EventBus,
	PerformanceTimestampMs,
	StickyEventBus,
	StickySubscribable,
	Subscribable,
	getNowPerformanceTimestamp,
} from "@teawithsand/tws-stl"

export type ShakeManagerConfig = {
	enabled: boolean
}

export type ShakeEvent = {}

const THRESHOLD = 12

export class ShakeManager {
	private readonly innerBus: StickyEventBus<ShakeManagerConfig> =
		new DefaultStickyEventBus({
			enabled: true,
		})

	public get bus(): StickySubscribable<ShakeManagerConfig> {
		return this.innerBus
	}

	private readonly innerShakeBus: EventBus<ShakeEvent> = new DefaultEventBus()

	get shakeBus(): Subscribable<ShakeEvent> {
		return this.innerShakeBus
	}

	get isSupported() {
		return (
			typeof window !== "undefined" &&
			typeof window.DeviceMotionEvent !== "undefined"
		)
	}

	enable = () => {
		this.innerBus.emitEvent({
			enabled: true,
		})
	}

	constructor() {
		let listener: ((event: DeviceMotionEvent) => void) | null = null
		this.innerBus.addSubscriber((event) => {
			if (event.enabled && this.isSupported) {
				if (listener) {
					window.removeEventListener("devicemotion", listener)
					listener = null
				}

				let lastAcceleration: {
					ts: PerformanceTimestampMs
					acc: number
				} | null = null

				listener = (event) => {
					const now = getNowPerformanceTimestamp()
					const { x = 0, y = 0, z = 0 } = event.acceleration ?? {}
					const acceleration = Math.sqrt(
						[x ?? 0, y ?? 0, z ?? 0]
							.map((v) => v * v)
							.reduce((pv, v) => pv + v)
					)
					if (lastAcceleration === null) {
						lastAcceleration = {
							acc: acceleration,
							ts: now,
						}
					} else {
						if (now - lastAcceleration.ts < 10) {
							// wait for next event, refresh was too fast
							return
						}
						const delta = Math.abs(
							lastAcceleration.acc - acceleration
						)
						if (acceleration * 0.9 + delta > THRESHOLD) {
							this.innerShakeBus.emitEvent({})
						}
					}
				}

				window.addEventListener("devicemotion", listener)
			} else {
				if (listener) {
					window.removeEventListener("devicemotion", listener)
					listener = null
				}
			}
		})
	}
}

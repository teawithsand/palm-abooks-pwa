import {
	GlobalPlayerConfig,
	INIT_GLOBAL_PLAYER_CONFIG,
} from "@app/domain/defines/config/config"
import {
	INIT_PERSISTENT_GLOBAL_PLAYER_STATE,
	PersistentGlobalPlayerState,
} from "@app/domain/defines/config/state"
import {
	DefaultStickyEventBus,
	Lock,
	MutexLockAdapter,
	StickySubscribable,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"
import localforage, { LOCALSTORAGE } from "localforage"

const forage = localforage.createInstance({
	name: "palm-abooks-pwa/forage",
	driver: [LOCALSTORAGE],
})

export function objectEquals(x: any, y: any): boolean {
	"use strict"

	if (x === null || x === undefined || y === null || y === undefined) {
		return x === y
	}
	// after this just checking type of one would be enough
	if (x.constructor !== y.constructor) {
		return false
	}
	// if they are functions, they should exactly refer to same one (because of closures)
	if (x instanceof Function) {
		return x === y
	}
	// if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
	if (x instanceof RegExp) {
		return x === y
	}
	if (x === y || x.valueOf() === y.valueOf()) {
		return true
	}
	if (Array.isArray(x) && x.length !== y.length) {
		return false
	}

	// if they are dates, they must had equal valueOf
	if (x instanceof Date) {
		return false
	}

	// if they are strictly equal, they both need to be object at least
	if (!(x instanceof Object)) {
		return false
	}
	if (!(y instanceof Object)) {
		return false
	}

	// recursive object equality check
	var p = Object.keys(x)
	return (
		Object.keys(y).every(function (i) {
			return p.indexOf(i) !== -1
		}) &&
		p.every(function (i) {
			return objectEquals(x[i], y[i])
		})
	)
}

export class GenericConfigManager<T extends Record<string, any>> {
	private readonly innerBus: DefaultStickyEventBus<T | null> =
		new DefaultStickyEventBus<T | null>(null)
	get bus(): StickySubscribable<T | null> {
		return this.innerBus
	}

	private configSynchronizer: () => Promise<void>

	public readonly loadedPromise: Promise<void>
	public readonly busPromise: Promise<StickySubscribable<T>>

	get loaded(): boolean {
		return this.bus.lastEvent !== null
	}

	constructor(key: string, initialValue: T) {
		let prevConfig: T | null = null

		let modified = false
		const mutex = new Lock(new MutexLockAdapter())

		const loadedPromise = mutex.withLock(async () => {
			try {
				const config = {
					// hack to make sure that all new fields are added
					// it's NOT here to implement backward compatibility or sth, it's more of debugging helper for dev releases
					...initialValue,
					...((await forage.getItem<T>(key)) ?? {}),
				}
				prevConfig = config

				this.innerBus.emitEvent(config)
			} catch (e) {
				console.error(e)
				throw e
			}
		})
		this.loadedPromise = loadedPromise

		this.busPromise = (async () => {
			await loadedPromise

			if (!this.bus.lastEvent)
				throw new Error(
					"Last event must not be undefine by now; unreachable code"
				)

			return this.bus as StickySubscribable<T> // do this casting, as we are sure that bus has event by now
		})()

		const syncConfig = async (cfg: T | null = this.bus.lastEvent) => {
			if (!cfg || !modified) return

			await mutex.withLock(async () => {
				if (modified) {
					forage.setItem(key, cfg)
					modified = false
				}
			})
		}
		this.configSynchronizer = syncConfig

		let timeout: any = null
		const startWatcher = () => {
			if (timeout) clearTimeout(timeout)
			timeout = setTimeout(() => {
				timeout = null
				syncConfig()
			}, 5000)
		}

		window.addEventListener("beforeunload", () => {
			syncConfig() // may not work, we should somehow forcibly wait for promise I guess
		})
		window.addEventListener("blur", () => {
			syncConfig() // sync config if user changed page. Reasonable I guess
		})

		this.bus.addSubscriber((config) => {
			if (!objectEquals(prevConfig, config)) {
				modified = true // this subscriber is responsible for setting this flag
				startWatcher()
			}
		})
	}

	/**
	 * Requests immediate save of config.
	 */
	save = async () => await this.configSynchronizer()

	/**
	 * Requests config update in atomic manner.
	 * It should be automatically saved ASAP.
	 */
	update = (mutator: (draft: Draft<T>) => void) => {
		const cfg = this.bus.lastEvent
		if (cfg !== undefined) {
			this.innerBus.emitEvent(produce(cfg, mutator))
		} else {
			throw new Error(
				`Config not loaded yet. Can't modify it. Consider waiting for it using bus.`
			)
		}
	}

	/**
	 * Throws if config is not loaded.
	 */
	getOrThrow = (): T => {
		const { lastEvent } = this.innerBus
		if (!lastEvent) {
			throw new Error(`Config was not loaded yet`)
		}

		return lastEvent
	}
}

export class ConfigManager {
	public readonly globalPlayerConfig =
		new GenericConfigManager<GlobalPlayerConfig>(
			"global-player-config",
			INIT_GLOBAL_PLAYER_CONFIG
		)

	public readonly globalPersistentPlayerState =
		new GenericConfigManager<PersistentGlobalPlayerState>(
			"persistent-player-state",
			INIT_PERSISTENT_GLOBAL_PLAYER_STATE
		)

	public readonly loadedPromise = Promise.all([
		this.globalPlayerConfig.loadedPromise,
		this.globalPersistentPlayerState.loadedPromise,
	])

	saveAll = async () => {
		await this.loadedPromise
		await this.globalPlayerConfig.save()
		await this.globalPersistentPlayerState.save()
	}
}

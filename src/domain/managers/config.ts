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
	StickyEventBus,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"
import localforage, { LOCALSTORAGE } from "localforage"

const forage = localforage.createInstance({
	name: "palm-abooks-pwa/forage",
	driver: [LOCALSTORAGE],
})

function objectEquals(x: any, y: any): boolean {
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

export class GenericConfigManager<T> {
	public readonly bus: StickyEventBus<T>
	private configSynchronizer: () => Promise<void>

	constructor(key: string, initialValue: T) {
		this.bus = new DefaultStickyEventBus(
			(forage.getItem(key) as T) ?? initialValue
		)

		let prevConfig = this.bus.lastEvent

		let modified = false
		const mutex = new Lock(new MutexLockAdapter())
		const syncConfig = async (cfg: T = this.bus.lastEvent) => {
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
		this.bus.emitEvent(produce(this.bus.lastEvent, mutator))
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

	saveAll = async () => {
		await this.globalPlayerConfig.save()
		await this.globalPersistentPlayerState.save()
	}
}

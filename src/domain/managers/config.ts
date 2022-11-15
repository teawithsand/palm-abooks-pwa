import {
	GlobalPlayerConfig,
	INIT_GLOBAL_PLAYER_CONFIG,
} from "@app/domain/defines/config/config"
import {
	DefaultStickyEventBus,
	Lock,
	MutexLockAdapter,
	StickyEventBus,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"
import localforage, { LOCALSTORAGE } from "localforage"

const globalPlayerConfigKey = "global-player-config"

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

export class ConfigManager {
	public readonly globalPlayerConfigBus: StickyEventBus<GlobalPlayerConfig>
	private configSynchronizer: () => Promise<void>

	constructor() {
		this.globalPlayerConfigBus = new DefaultStickyEventBus(
			forage.getItem(globalPlayerConfigKey) ?? INIT_GLOBAL_PLAYER_CONFIG
		)

		let prevConfig = this.globalPlayerConfigBus.lastEvent

		let modified = false
		const mutex = new Lock(new MutexLockAdapter())
		const syncConfig = async (
			cfg: GlobalPlayerConfig = this.globalPlayerConfigBus.lastEvent
		) => {
			await mutex.withLock(async () => {
				if (modified) {
					forage.setItem(globalPlayerConfigKey, cfg)
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

		this.globalPlayerConfigBus.addSubscriber((config) => {
			if (!objectEquals(prevConfig, config)) {
				modified = true // this subscriber is responsible for setting this flag
				startWatcher()
			}
		})
	}

	/**
	 * Requests immediate save of all configs.
	 */
	saveConfigs = async () => await this.configSynchronizer()

	/**
	 * Requests GlobalPlayerConfig update in atomic manner.
	 * It should be automatically saved ASAP.
	 */
	updateGlobalPlayerConfig = (
		mutator: (draft: Draft<GlobalPlayerConfig>) => void
	) => {
		this.globalPlayerConfigBus.emitEvent(
			produce(this.globalPlayerConfigBus.lastEvent, mutator)
		)
	}
}

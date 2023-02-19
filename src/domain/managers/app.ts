import { ConfigManager } from "@app/domain/managers/config"
import { GlobalEventsManager } from "@app/domain/managers/globalEventsManager"
import { InitializationManager } from "@app/domain/managers/initialization"
import { PlayerEntryListManager } from "@app/domain/managers/newPlayer/list/playerEntryListManager"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import { PlayerActionManager } from "@app/domain/managers/newPlayer/playerActionsManager"
import { SeekBackManager } from "@app/domain/managers/newPlayer/seekBack/seekBackManager"
import { SleepManager } from "@app/domain/managers/newPlayer/sleep/sleepManager"
import { ShakeManager } from "@app/domain/managers/shakeManager"
import { StorageSizeManager } from "@app/domain/managers/storageSizeManager"
import { AbookDb } from "@app/domain/storage/db"
import { latePromise } from "@teawithsand/tws-stl"
import { isSsr } from "@teawithsand/tws-stl-react"

export class AppManager {
	/**
	 * Note: This field is quite hacky and should not be used.
	 * Use `useAppManager` hook instead.
	 */
	// public static readonly instance: AppManager = new AppManager()

	public readonly shakeManager = new ShakeManager()
	public readonly globalEventsManager = new GlobalEventsManager()
	public readonly storageSizeManager = new StorageSizeManager()
	public readonly abookDb: AbookDb = new AbookDb(this.storageSizeManager)

	public readonly configManager = new ConfigManager()
	public readonly entryListManager = new PlayerEntryListManager()
	public readonly playerManager = new NewPlayerManager(
		this.entryListManager,
		this.abookDb
	)

	public readonly sleepManager = new SleepManager(
		this.playerManager,
		this.configManager,
		this.shakeManager
	)

	public readonly positionMoveAfterPauseManager = new SeekBackManager(
		this.configManager,
		this.playerManager
	)

	public readonly playerActionsManager = new PlayerActionManager(
		this.abookDb,
		this.playerManager,
		this.configManager,
		this.entryListManager,
		this.sleepManager
	)

	public readonly initManager = new InitializationManager()

	constructor() {
		const [p1, resolveP1] = latePromise<void>()
		this.configManager.globalPersistentPlayerState.bus.addSubscriber(
			(config, canceler) => {
				if (config) {
					resolveP1()
					canceler()

					if (config.lastPlayed) {
						// TODO(teawithsand): implement last played loading here
					}
				}
			}
		)

		const [p2, resolveP2] = latePromise<void>()
		this.configManager.globalPlayerConfig.bus.addSubscriber(
			(config, canceler) => {
				if (config) {
					// HACK: canceller has to be called here in order to prevent infinite recursion
					// as sleep manager updates config, we would trigger that update(even though it's no-op update)
					// and go through another iteration of this listener
					canceler()
					resolveP2()

					if (config.isSleepEnabled) {
						this.sleepManager.setSleep(config.sleepConfig)
					}
				}
			}
		)

		this.initManager.addPromise(
			this.configManager.loadedPromise.then(() => {})
		)
		this.initManager.addPromise(p1)
		this.initManager.addPromise(p2)
		this.initManager.finalize()

		// Enabling has to be done by user initiated event.
		// Click is good enough to do so at some point, if it's required
		document.addEventListener("click", () => {
			if (this.configManager.globalPlayerConfig.loaded) {
				// enable this if it's needed or not just because it may become needed at some point
				// and why not
				this.shakeManager.enable()
			}
		})
	}
}

let globalAppManager: AppManager | null = null

export const useAppManager = () => {
	// HACK: this way we do not app code on SSR, so we do not throw
	if (isSsr()) return null as any as AppManager
	if (globalAppManager) return globalAppManager
	const am = new AppManager()
	globalAppManager = am
	return am
}

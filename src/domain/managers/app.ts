import { lastPlayedSourceToWhatToPlaySourceLocator } from "@app/domain/defines/config/state"
import { ConfigManager } from "@app/domain/managers/config"
import { GlobalEventsManager } from "@app/domain/managers/globalEventsManager"
import { MetadataLoadHelper } from "@app/domain/managers/metadataHelper"
import { PlayerActionManager } from "@app/domain/managers/player/playerActionsManager"
import { PlayerManager } from "@app/domain/managers/player/playerManager"
import { PositionMoveAfterPauseManager } from "@app/domain/managers/position/positionMoveAfterPauseHelper"
import { PositionSavingManager } from "@app/domain/managers/position/positionSavingManager"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { ShakeManager } from "@app/domain/managers/sleep/shakeManager"
import { SleepManager } from "@app/domain/managers/sleep/sleepManager"
import { StorageSizeManager } from "@app/domain/managers/storageSizeManager"
import { WhatToPlayLocatorResolverImpl } from "@app/domain/managers/whatToPlay/whatToPlayLocatorResolver"
import { WhatToPlayLocatorWriterImpl } from "@app/domain/managers/whatToPlay/whatToPlayLocatorWriter"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlay/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"
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
	public readonly whatToPlayManager = new WhatToPlayManager(
		new MetadataLoadHelper(
			new PlayableEntryPlayerSourceResolver(this.abookDb)
		),
		new WhatToPlayLocatorResolverImpl(this.abookDb)
	)

	public readonly configManager = new ConfigManager()
	public readonly playerManager = new PlayerManager(
		this.abookDb,
		this.configManager,
		this.whatToPlayManager
	)
	public readonly sleepManager = new SleepManager(
		this.playerManager,
		this.configManager,
		this.shakeManager
	)

	public readonly positionSavingManager = new PositionSavingManager(
		this.playerManager,
		new WhatToPlayLocatorWriterImpl(this.abookDb)
	)

	public readonly positionMoveAfterPauseManager =
		new PositionMoveAfterPauseManager(this.playerManager)

	public readonly playerActionsManager = new PlayerActionManager(
		this.playerManager,
		this.configManager,
		this.whatToPlayManager,
		this.sleepManager,
		this.positionMoveAfterPauseManager
	)

	public readonly initPromise = Promise.all([
		this.configManager.loadedPromise,
	])

	constructor() {
		// Enabling has to be done by user initiated event.
		// Click is good enough to do so at some point, if it's required
		document.addEventListener("click", () => {
			if (this.configManager.globalPlayerConfig.loaded) {
				// enable this if it's needed or not just because it may become needed at some point
				// and why not
				this.shakeManager.enable()
			}
		})

		this.configManager.globalPersistentPlayerState.bus.addSubscriber(
			(config, canceler) => {
				if (config !== undefined) {
					canceler()

					if (config.lastPlayed) {
						this.whatToPlayManager.setLocator(
							lastPlayedSourceToWhatToPlaySourceLocator(
								config.lastPlayed
							)
						)
					}
				}
			}
		)

		this.configManager.globalPlayerConfig.bus.addSubscriber(
			(config, canceler) => {
				if (config !== undefined) {
					// HACK: canceller has to be called here in order to prevent infinite recursion
					// as sleep manager updates config, we would trigger that update(even though it's no-op update)
					// and go through another iteration of this listener
					canceler()

					if (config.isSleepEnabled) {
						this.sleepManager.setSleep(config.sleepConfig)
					}
				}
			}
		)
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

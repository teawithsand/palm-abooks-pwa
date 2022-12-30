import { lastPlayedSourceToWhatToPlaySourceLocator } from "@app/domain/defines/config/state"
import { ConfigManager } from "@app/domain/managers/config"
import { GlobalEventsManager } from "@app/domain/managers/globalEventsManager"
import { MetadataLoadHelper } from "@app/domain/managers/metadataHelper"
import { PlayerActionManager } from "@app/domain/managers/player/playerActionsManager"
import { PlayerManager } from "@app/domain/managers/player/playerManager"
import { PositionMoveAfterPauseManager } from "@app/domain/managers/position/positionMoveAfterPauseHelper"
import { PositionSavingManager } from "@app/domain/managers/position/positionSavingManager"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { SleepManager } from "@app/domain/managers/sleep/sleepManager"
import { StorageSizeManager } from "@app/domain/managers/storageSizeManager"
import { WhatToPlayLocatorResolverImpl } from "@app/domain/managers/whatToPlay/whatToPlayLocatorResolver"
import { WhatToPlayLocatorWriterImpl } from "@app/domain/managers/whatToPlay/whatToPlayLocatorWriter"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlay/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"

export class AppManager {
	/**
	 * Note: This field is quite hacky and should not be used.
	 * Use `useAppManager` hook instead.
	 */
	public static readonly instance: AppManager = new AppManager()
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
	public readonly sleepManager = new SleepManager(this.playerManager)

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
	)

	public readonly initPromise = Promise.all([
		this.configManager.loadedPromise,
	])

	private constructor() {
		this.configManager.globalPersistentPlayerState.bus.addSubscriber(
			(config, canceler) => {
				if (config !== undefined) {
					try {
						if (config.lastPlayed) {
							this.whatToPlayManager.setLocator(
								lastPlayedSourceToWhatToPlaySourceLocator(
									config.lastPlayed
								)
							)
						}
					} finally {
						canceler()
					}
				}
			}
		)
	}
}

export const useAppManager = () => AppManager.instance

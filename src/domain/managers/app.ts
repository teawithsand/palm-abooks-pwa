import { lastPlayedSourceToWhatToPlaySourceLocator } from "@app/domain/defines/config/state"
import { ConfigManager } from "@app/domain/managers/config"
import { GlobalEventsManager } from "@app/domain/managers/globalEventsManager"
import { MetadataLoadHelper } from "@app/domain/managers/metadataHelper"
import { PlayerActionManager } from "@app/domain/managers/playerActionsManager"
import { PlayerManager } from "@app/domain/managers/playerManager"
import { PositionLoadingManager } from "@app/domain/managers/position/positionLoadingManager"
import { PositionMoveAfterPauseManager } from "@app/domain/managers/position/positionMoveAfterPauseManager"
import { PositionSavingManager } from "@app/domain/managers/position/positionSavingManager"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { StorageSizeManager } from "@app/domain/managers/storageSizeManager"
import { WhatToPlayLocatorResolverImpl } from "@app/domain/managers/whatToPlayLocatorResolver"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
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
		this.configManager
	)

	public readonly playerActionsManager = new PlayerActionManager(
		this.playerManager,
		this.whatToPlayManager,
		this.configManager
	)

	public readonly positionMoveAfterPauseManager =
		new PositionMoveAfterPauseManager(
			this.whatToPlayManager,
			this.playerManager
		)

	public readonly positionLoadingManager = new PositionLoadingManager(
		this.whatToPlayManager,
		this.playerManager,
		this.playerActionsManager,
		this.positionMoveAfterPauseManager
	)

	public readonly positionSavingManager = new PositionSavingManager(
		this.abookDb,
		this.whatToPlayManager,
		this.playerManager,
		this.positionLoadingManager
	)

	public readonly initPromise = Promise.all([
		this.configManager.loadedPromise,
	])

	private constructor() {
		this.whatToPlayManager.bus.addSubscriber((data) => {
			this.playerManager.setSources(data?.entriesBag.entries ?? [])
		})

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

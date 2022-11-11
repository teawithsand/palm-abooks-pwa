import { MetadataLoadHelper } from "@app/domain/managers/metadataHelper"
import { PlayerManager } from "@app/domain/managers/playerManager"
import { PlayableEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"

export class AppManager {
	/**
	 * Note: This field is quite hacky and should not be used.
	 * Use `useAppManager` hook instead.
	 */
	public static readonly instance: AppManager = new AppManager()

	public readonly abookDb: AbookDb = new AbookDb()
	public readonly whatToPlayManager = new WhatToPlayManager(
		new MetadataLoadHelper(
			new PlayableEntryPlayerSourceResolver(this.abookDb)
		)
	)

	public readonly playerManager = new PlayerManager(this.abookDb)

	private constructor() {
		this.whatToPlayManager.bus.addSubscriber((data) => {
			this.playerManager.setSources(data?.entries ?? [])
		})
	}
}

export const useAppManager = () => AppManager.instance

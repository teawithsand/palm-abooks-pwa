import { FileEntry } from "@app/domain/defines/abookFile"
import { FileEntryPlayerSourceResolver } from "@app/domain/managers/resolver"
import {
	WhatToPlayDataType,
	WhatToPlayManager,
} from "@app/domain/managers/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"
import { MapPlayerSourceProvider, Player } from "@teawithsand/tws-player"

const emptySourceProvider = new MapPlayerSourceProvider<FileEntry>(
	[],
	(s) => s.id
)

export class AppManager {
	/**
	 * Note: This field is quite hacky and should not be used.
	 * Use `useAppManager` hook instead.
	 */
	public static readonly instance: AppManager = new AppManager()

	public readonly whatToPlayManager = new WhatToPlayManager()
	public readonly abookDb: AbookDb = new AbookDb()
	public readonly player = new Player(
		new MapPlayerSourceProvider<FileEntry>([], (s) => s.id),
		new FileEntryPlayerSourceResolver(this.abookDb)
	)

	private constructor() {
		this.whatToPlayManager.bus.addSubscriber((data) => {
			if (!data) {
				this.player.setSourceProvider(emptySourceProvider)
			} else if (data.type === WhatToPlayDataType.ABOOK) {
				this.player.setSourceProvider(
					new MapPlayerSourceProvider(data.abook.entries, (s) => s.id)
				)
			} else if (data.type === WhatToPlayDataType.USER_PROVIDED_ENTRIES) {
				throw new Error("NIY")
			}
		})
	}
}

export const useAppManager = () => AppManager.instance

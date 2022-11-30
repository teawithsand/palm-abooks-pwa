import { AbookId } from "@app/domain/defines/abook"
import { SavedPositionVariants } from "@app/domain/defines/position"
import {
	WhatToPlayLocator,
	WhatToPlayLocatorType,
} from "@app/domain/defines/whatToPlay/locator"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { AbookDb } from "@app/domain/storage/db"
import { MetadataBag } from "@teawithsand/tws-player"
import { Lock, MutexLockAdapter } from "@teawithsand/tws-stl"

export interface WhatToPlayLocatorWriter {
	savePosition(
		locator: WhatToPlayLocator,
		position: SavedPositionVariants
	): Promise<void>

	saveMetadata(
		locator: WhatToPlayLocator,
		entries: PlayableEntriesBag,
		metadata: MetadataBag
	): Promise<void>
}

export class WhatToPlayLocatorWriterImpl implements WhatToPlayLocatorWriter {
	constructor(private readonly db: AbookDb) {}

	// This one is as used as safety, external synchronization should be used instead.
	private readonly mutex = new Lock(new MutexLockAdapter())

	savePosition = async (
		locator: WhatToPlayLocator,
		position: SavedPositionVariants
	): Promise<void> => {
		await this.mutex.withLock(async () => {
			if (
				locator.type === WhatToPlayLocatorType.ABOOK ||
				locator.type === WhatToPlayLocatorType.ABOOK_ID
			) {
				let abookId: AbookId
				if (locator.type === WhatToPlayLocatorType.ABOOK) {
					abookId = locator.abook.id
				} else {
					abookId = locator.id
				}

				const writeAccess = await this.db.abookWriteAccess(abookId)
				try {
					await writeAccess.update((draft) => {
						draft.position = position
					})
				} finally {
					writeAccess.release()
				}
			}
		})
	}

	saveMetadata = async (
		locator: WhatToPlayLocator,
		entries: PlayableEntriesBag,
		metadata: MetadataBag
	): Promise<void> => {
		// NIY
	}
}

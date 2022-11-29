import { Abook } from "@app/domain/defines/abook"
import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import {
	PlayableEntry,
	PlayableEntryType,
} from "@app/domain/defines/player/playableEntry"
import {
	WhatToPlayData,
	WhatToPlayDataType,
} from "@app/domain/defines/whatToPlay/data"
import {
	WhatToPlayLocator,
	WhatToPlayLocatorType,
} from "@app/domain/defines/whatToPlay/locator"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { AbookDb } from "@app/domain/storage/db"
import { getFileEntryDisposition } from "@app/domain/storage/disposition"
import { MetadataBag, SourcePlayerError } from "@teawithsand/tws-player"
import { generateUUID } from "@teawithsand/tws-stl"

export interface WhatToPlayLocatorResolver {
	resolveLocator(locator: WhatToPlayLocator): Promise<WhatToPlayData>
}

export class WhatToPlayLocatorResolverImpl
	implements WhatToPlayLocatorResolver
{
	constructor(private readonly db: AbookDb) {}

	private fromAbook = (abook: Abook): WhatToPlayData => {
		const musicEntries = abook.entries.filter(
			(e) => getFileEntryDisposition(e) === FileEntryDisposition.MUSIC
		)

		const entries: PlayableEntry[] = musicEntries.map((e) => ({
			type: PlayableEntryType.FILE_ENTRY,
			entry: e,
			id: e.id,
		}))

		return {
			type: WhatToPlayDataType.ABOOK,
			id: generateUUID(),
			abook,
			metadata: new MetadataBag(
				musicEntries.map((e) => e.metadata.musicMetadata)
			),
			entries,
			entriesBag: new PlayableEntriesBag(entries),
			locator: {
				type: WhatToPlayLocatorType.ABOOK_ID,
				id: abook.id,
			},
			positionToLoad: abook.position ?? {},
		}
	}

	resolveLocator = async (
		locator: WhatToPlayLocator
	): Promise<WhatToPlayData> => {
		if (locator.type === WhatToPlayLocatorType.ABOOK) {
			return this.fromAbook(locator.abook)
		} else if (locator.type === WhatToPlayLocatorType.ABOOK_ID) {
			const abook = (await this.db.listAbooks()).find(
				(abook) => abook.id === locator.id
			)
			if (!abook) {
				throw new SourcePlayerError(
					`Can't find abook with id ${locator.id}`
				)
			}

			return this.fromAbook(abook)
		} else if (locator.type === WhatToPlayLocatorType.RAW_ENTRIES) {
			const entries = locator.files.flatMap((v): PlayableEntry[] => {
				if (typeof v === "string") {
					return [
						{
							id: generateUUID(),
							type: PlayableEntryType.ARBITRARY_URL,
							url: v,
						},
					]
				} else if (v instanceof File || v instanceof Blob) {
					return [
						{
							id: generateUUID(),
							type: PlayableEntryType.ARBITRARY_BLOB,
							blob: v,
						},
					]
				} else {
					throw new Error(`Invalid data provided as raw entry ${v}`)
				}
			})

			return {
				type: WhatToPlayDataType.USER_PROVIDED_ENTRIES,
				id: generateUUID(),
				metadata: new MetadataBag(new Array(entries.length).fill(null)),
				entries,
				entriesBag: new PlayableEntriesBag(entries),
				locator,
				positionToLoad: {},
			}
		} else {
			throw new Error(`Invalid locator ${locator}`)
		}
	}
}

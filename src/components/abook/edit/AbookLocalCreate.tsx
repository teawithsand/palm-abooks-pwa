import { AbookFormCreate } from "@app/components/abook/form/create"
import {
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { AbookEntity, AbookEntityData } from "@app/domain/defines/entity/abook"
import {
	FileEntryEntity,
	FileEntryEntityData,
} from "@app/domain/defines/entity/fileEntry"
import { useAppManager } from "@app/domain/managers/app"
import { FilePlayerSourceResolver } from "@app/domain/managers/resolver"
import { guessFileDisposition } from "@app/domain/storage/disposition"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import {
	DefaultMetadataLoader,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "@teawithsand/tws-player"
import {
	TimestampMs,
	generateUUID,
	getNowTimestamp,
} from "@teawithsand/tws-stl"
import React from "react"

// TODO(teawithsand): unify that creation procedure; make it part of abook write access maybe

export const AbookLocalCreate = () => {
	const navigate = useNavigate()
	const { abookShowPath } = useAppPaths()
	const app = useAppManager()

	return (
		<AbookFormCreate
			onSubmit={async (data) => {
				const id = generateUUID()

				// TODO(teawithsand): for sake of simplicity load metadata of music files eagerly
				// it does not really matter if I do so for local files, as it's really fast for these

				const loader = new DefaultMetadataLoader(
					new FilePlayerSourceResolver()
				)

				const abook: AbookEntityData = {
					id,
					position: null,

					addedAt: getNowTimestamp(),
					authorName: data.author,
					title: data.title,
					description: data.description,
					lastPlayedAt: 0 as TimestampMs,
					publishedYear: 0,

					entries: [],
				}
				const metadataMap: Map<number, MetadataLoadingResult> =
					new Map()

				let i = 0
				for (const f of data.files) {
					try {
						if (
							guessFileDisposition(f) !==
							FileEntryDisposition.MUSIC
						)
							continue

						let result: MetadataLoadingResult
						try {
							const metadata = await loader.loadMetadata(f)
							result = {
								type: MetadataLoadingResultType.OK,
								metadata,
							}
						} catch (e) {
							result = {
								type: MetadataLoadingResultType.ERROR,
								error: String(e) || "Unknown error",
							}
						}

						metadataMap.set(i, result)
					} finally {
						i++
					}
				}

				await app.abookDb.createAbook(new AbookEntity(abook))
				const abookAccess = await app.abookDb.abookWriteAccess(abook.id)

				try {
					let i = 0
					for (const f of data.files) {
						try {
							await abookAccess.addInternalFile(
								f,
								(draft, newFileId) => {
									const entry: FileEntryEntityData = {
										id: generateUUID(),

										name: f.name,
										mime: f.type,
										size: f.size,
										disposition: null, // this is for overrides, by default use dynamic disposition
										musicMetadata:
											metadataMap.get(i) ?? null,
									}

									draft.entries.push(
										new FileEntryEntity(entry, {
											dataType:
												FileEntryType.INTERNAL_FILE,
											internalFileId: newFileId,
										})
									)
								}
							)
						} finally {
							i++
						}
					}
				} finally {
					abookAccess.release()
				}

				navigate(abookShowPath(id))
			}}
		/>
	)
}

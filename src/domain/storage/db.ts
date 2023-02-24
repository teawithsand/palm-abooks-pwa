import { AbookId } from "@app/domain/defines/abook"
import Dexie, { Table } from "dexie"

import { FileEntryType } from "@app/domain/defines/abookFile"
import {
	AbookEntity,
	AbookEntityData,
	StoredAbookEntity,
} from "@app/domain/defines/entity/abook"
import { FileEntryEntity } from "@app/domain/defines/entity/fileEntry"
import {
	InternalFile,
	InternalFileOwnerDataType,
} from "@app/domain/defines/externalFile"
import { StorageSizeManager } from "@app/domain/managers/storageSizeManager"
import {
	GLOBAL_WEB_KEYED_LOCKS,
	MiddlewareKeyedLocks,
	generateUUID,
	throwExpression,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

const eqSet = <T>(xs: Set<T>, ys: Set<T>) =>
	xs.size === ys.size && [...xs].every((x) => ys.has(x))
const extractAbookInternalFileIds = (abook: AbookEntity): Set<string> =>
	new Set(
		abook.entries
			.map((v) =>
				v.content.dataType === FileEntryType.INTERNAL_FILE
					? v.content.internalFileId
					: undefined
			)
			.filter((v) => typeof v === "string")
	) as Set<string>

export class AbookWriteAccess {
	private isReleased = false

	constructor(
		private readonly db: AbookDb,
		private abook: AbookEntity,
		private readonly releaser: () => void
	) {}

	getAbook = (): Readonly<AbookEntity> => {
		return this.abook
	}

	/**
	 * Note: user of this function MUST NOT drop locally stored entries
	 */
	private innerUpdate = async (
		mutator: (draft: Draft<AbookEntityData>) => void,
		checker?: (oldAbook: AbookEntity, newAbook: AbookEntity) => void
	) => {
		this.checkReleased()

		const newAbookData = produce(this.abook.data, (draft) => {
			mutator(draft)
		})

		const newAbook = new AbookEntity(newAbookData)

		if (checker) checker(this.abook, newAbook)

		if (this.abook.id !== newAbook.id)
			throw new Error(
				"Id was changed during abook update, which is not valid operation"
			)

		await this.db.abooks.put(newAbook.serialize())
		this.abook = newAbook

		this.db.onStorageModified()
	}

	delete = async () => {
		this.checkReleased()

		await this.db.transaction(
			"rw?",
			this.db.abooks,
			this.db.internalFiles,
			async () => {
				const internalEntries = extractAbookInternalFileIds(this.abook)

				for (const e of internalEntries) {
					await this.db.internalFiles.delete(
						e ??
							throwExpression(new Error("Entry must be provided"))
					)
				}

				await this.db.abooks.delete(this.abook.id)
			}
		)

		this.db.onStorageModified()
		this.release()
	}

	/**
	 * Note: user of this function MUST NOT drop locally stored entries
	 */
	update = async (mutator: (draft: Draft<AbookEntityData>) => void) => {
		await this.innerUpdate(mutator, (oldAbook, newAbook) => {
			const oldAbookLocalFiles = extractAbookInternalFileIds(oldAbook)
			const newAbookLocalFiles = extractAbookInternalFileIds(newAbook)

			if (!eqSet(oldAbookLocalFiles, newAbookLocalFiles))
				throw new Error(
					`Old and new Abook local file sets have changed during update`
				)
		})
	}

	dropFileEntries = async (...indexes: number[]) => {
		const min = indexes.reduce((a, b) => Math.min(a, b))
		const max = indexes.reduce((a, b) => Math.max(a, b))
		if (min < 0 || max >= this.abook.entries.length)
			throw new Error(
				`No file entry with index ${max} or index ${min} < 0`
			)

		const indexSet = new Set(indexes)

		const targetEntriesIdSet = new Set(
			this.abook.entries
				.filter((_, i) => !indexSet.has(i))
				.map((v) => v.id)
		)
		const removedEntriesIdSet = this.abook.entries
			.filter((v) => !targetEntriesIdSet.has(v.id))
			.map((v) => v.id)

		await this.db.transaction(
			"rw?",
			this.db.abooks,
			this.db.internalFiles,
			async () => {
				for (const id of removedEntriesIdSet) {
					const entryIndex = this.abook.entries.findIndex(
						(e) => e.id === id
					)
					if (entryIndex < 0) throw new Error("Unreachable code")

					const entry = this.abook.entries[entryIndex]

					if (
						entry.content.dataType === FileEntryType.INTERNAL_FILE
					) {
						await this.db.internalFiles.delete(
							entry.content.internalFileId
						)
					}

					await this.innerUpdate((draft) => {
						draft.entries.splice(entryIndex, 1)
					})
				}
			}
		)

		this.db.onStorageModified()
	}

	addInternalFileExt = async (
		name: string,
		blob: Blob,
		mutator?: (
			draft: Draft<AbookEntityData>,
			entry: FileEntryEntity
		) => void
	) => {
		await this.addInternalFile(blob, (draft, newFileId) => {
			const entry = new FileEntryEntity(
				{
					id: generateUUID(),
					disposition: null,
					mime: blob.type,
					musicMetadata: null,
					name,
					size: blob.size,
				},
				{
					dataType: FileEntryType.INTERNAL_FILE,
					internalFileId: newFileId,
				}
			)
			if (mutator) {
				mutator(draft, entry)
			} else {
				draft.entries.push(entry)
			}
		})
	}

	/**
	 * @deprecated Instead use extended version, which handles more stuff including loading metadata.
	 */
	addInternalFile = async (
		blob: Blob,
		mutator: (draft: Draft<AbookEntityData>, newFileId: string) => void
	) => {
		this.checkReleased()

		await this.db.transaction(
			"rw?",
			this.db.abooks,
			this.db.internalFiles,
			async () => {
				const internalFileId = generateUUID()
				await this.db.internalFiles.add({
					id: internalFileId,
					blob: blob,
					owner: {
						type: InternalFileOwnerDataType.ABOOK,
						abookId: this.abook.id,
					},
				})

				await this.innerUpdate(
					(draft) => mutator(draft, internalFileId),
					(oldAbook, newAbook) => {
						const oldAbookLocalFiles =
							extractAbookInternalFileIds(oldAbook)
						const newAbookLocalFiles =
							extractAbookInternalFileIds(newAbook)

						if (!newAbookLocalFiles.has(internalFileId))
							throw new Error("File was not added")

						newAbookLocalFiles.delete(internalFileId)

						if (!eqSet(oldAbookLocalFiles, newAbookLocalFiles))
							throw new Error(
								`Old and new Abook local file sets have changed during update(except new file id)`
							)
					}
				)
			}
		)

		this.db.onStorageModified()
	}

	private checkReleased = () => {
		if (this.isReleased)
			throw new Error(`Abook access for ${this.abook.id} was released`)
	}

	release = () => {
		this.isReleased = true
		this.releaser()
	}
}

export class AbookDb extends Dexie {
	abooks!: Table<StoredAbookEntity, string>
	internalFiles!: Table<InternalFile, string>

	public readonly locks = new MiddlewareKeyedLocks(
		GLOBAL_WEB_KEYED_LOCKS,
		(key) => "tws-abook-player/" + key
	)

	constructor(private readonly storageSizeManager: StorageSizeManager) {
		super("tws-abook/abook-db")
		this.init()
	}

	private init = () => {
		this.version(1).stores({
			abooks: "id",
			internalFiles: "id,ownerType,ownerId,[ownerType+ownerId]",
		})
	}

	/**
	 * Reserved for internal usage.
	 * Should not be modified.
	 * May be removed any moment.
	 */
	public onStorageModified = () => {
		this.storageSizeManager.requestStatsUpdate()
	}

	createAbook = async (abook: AbookEntity) => {
		await this.abooks.add(abook.serialize())
		this.onStorageModified()
	}

	readAbook = async (id: AbookId): Promise<AbookEntity | null> => {
		const raw = (await this.abooks.where("id").equals(id).first()) ?? null
		if (!raw) return null
		return AbookEntity.serializer.deserialize(raw)
	}

	listAbooks = async (
		offset: number = 0,
		limit?: number
	): Promise<AbookEntity[]> => {
		let q = this.abooks.offset(offset)
		if (typeof limit === "number" || typeof limit === "bigint") {
			q = q.limit(limit)
		}
		return (await q.toArray()).map((v) =>
			AbookEntity.serializer.deserialize(v)
		)
	}

	abookWriteAccess = async (id: AbookId): Promise<AbookWriteAccess> => {
		const rawAbook = await this.abooks.get(id)
		if (!rawAbook)
			throw new Error(
				`Abook with id ${id} was not found for obtaining access`
			)

		const lock = this.locks.getRWLock(id, {})
		const releaser = await lock.lockWrite()

		const abook = AbookEntity.serializer.deserialize(rawAbook)

		return new AbookWriteAccess(this, abook, releaser)
	}

	runWithAbookWriteAccess = async <T>(
		id: AbookId,
		callback: (access: AbookWriteAccess) => Promise<T>
	): Promise<T> => {
		const access = await this.abookWriteAccess(id)
		try {
			return await callback(access)
		} finally {
			access.release()
		}
	}

	/**
	 * Translates internal file id to blob, if such internal file exists.
	 * Otherwise returns null.
	 *
	 * TODO(teawithsand): use caching resolver instead. It was already implemented in tws-player.
	 */
	getInternalFileBlob = async (id: string): Promise<Blob | null> => {
		const file = (await this.internalFiles.get(id)) ?? null
		return file?.blob ?? null
	}

	clear = async () => {
		await this.transaction(
			"rw?",
			this.abooks,
			this.internalFiles,
			async () => {
				await this.abooks.clear()
				await this.internalFiles.clear()
			}
		)
	}
}

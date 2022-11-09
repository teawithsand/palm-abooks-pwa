import { Abook, AbookId } from "@app/domain/defines/abook"
import Dexie, { Table } from "dexie"

import { FileEntryType } from "@app/domain/defines/abookFile"
import {
	InternalFile,
	InternalFileOwnerDataType,
} from "@app/domain/defines/externalFile"
import {
	generateUUID,
	GLOBAL_WEB_KEYED_LOCKS,
	MiddlewareKeyedLocks,
	throwExpression,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export const AbookDbLock = new MiddlewareKeyedLocks(
	GLOBAL_WEB_KEYED_LOCKS,
	(key) => "tws-abook-player/" + key
)

const eqSet = <T>(xs: Set<T>, ys: Set<T>) =>
	xs.size === ys.size && [...xs].every((x) => ys.has(x))
const extractAbookInternalFileIds = (abook: Abook): Set<string> =>
	new Set(
		abook.entries
			.map((v) =>
				v.data.dataType === FileEntryType.INTERNAL_FILE
					? v.data.internalFileId
					: undefined
			)
			.filter((v) => typeof v === "string")
	) as Set<string>

export class AbookWriteAccess {
	private isReleased = false

	constructor(
		private readonly db: AbookDb,
		private abook: Abook,
		private readonly releaser: () => void
	) {}

	/**
	 * Note: user of this function MUST NOT drop locally stored entries
	 */
	private innerUpdate = async (
		mutator: (draft: Draft<Abook>) => void,
		checker?: (oldAbook: Abook, newAbook: Abook) => void
	) => {
		this.checkReleased()

		const newAbook = produce(this.abook, (draft) => {
			mutator(draft)
		})

		if (checker) checker(this.abook, newAbook)

		await this.db.abooks.put(newAbook)

		this.abook = newAbook
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

		this.release()
	}

	/**
	 * Note: user of this function MUST NOT drop locally stored entries
	 */
	update = async (mutator: (draft: Draft<Abook>) => void) => {
		await this.innerUpdate(mutator, (oldAbook, newAbook) => {
			const oldAbookLocalFiles = extractAbookInternalFileIds(oldAbook)
			const newAbookLocalFiles = extractAbookInternalFileIds(newAbook)

			if (!eqSet(oldAbookLocalFiles, newAbookLocalFiles))
				throw new Error(
					`Old and new Abook local file sets have changed during update`
				)
		})
	}

	dropFileEntry = async (idx: number) => {
		const entry =
			this.abook.entries[idx] ??
			throwExpression(new Error(`No file entry with index ${idx}`))

		await this.db.transaction(
			"rw?",
			this.db.abooks,
			this.db.internalFiles,
			async () => {
				if (entry.data.dataType === FileEntryType.INTERNAL_FILE) {
					await this.db.internalFiles.delete(
						entry.data.internalFileId
					)
				}

				await this.innerUpdate((draft) => {
					draft.entries.splice(idx, 1)
				})
			}
		)
	}

	addInternalFile = async (
		blob: Blob | File,
		mutator: (draft: Draft<Abook>, newFileId: string) => void
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
	abooks!: Table<Abook, string>
	internalFiles!: Table<InternalFile, string>

	public readonly locks = AbookDbLock

	constructor() {
		super("tws-abook/abook-db")
		this.init()
	}

	private init = () => {
		this.version(1).stores({
			abooks: "id",
			internalFiles: "id,ownerType,ownerId,[ownerType+ownerId]",
		})
	}

	createAbook = async (abook: Abook) => {
		await this.abooks.add(abook)
	}

	readAbook = async (id: AbookId): Promise<Abook | null> => {
		return (await this.abooks.where("id").equals(id).first()) ?? null
	}

	listAbooks = async (
		offset: number = 0,
		limit?: number
	): Promise<Abook[]> => {
		let q = this.abooks.offset(offset)
		if (typeof limit === "number" || typeof limit === "bigint") {
			q = q.limit(limit)
		}
		return await q.toArray()
	}

	abookWriteAccess = async (id: AbookId): Promise<AbookWriteAccess> => {
		const abook = await this.abooks.get(id)
		if (!abook)
			throw new Error(
				`Abook with id ${id} was not found for obtaining access`
			)

		const lock = this.locks.getRWLock(id, {})
		const releaser = await lock.lockWrite()

		return new AbookWriteAccess(this, abook, releaser)
	}

	/**
	 * Translates internal file id to blob, if such internal file exists.
	 * Otherwise returns null.
	 *
	 * TODO(teawithsand): use caching resolver instead. It was already implemented in tws-player.
	 */
	getInternalFileBlob = async (id: string): Promise<Blob | File | null> => {
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

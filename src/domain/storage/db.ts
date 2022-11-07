import { Abook, AbookId } from "@app/domain/defines/abook"
import Dexie, { Table } from "dexie"

import {
	AbookFileDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
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

export const AbookDBLock = new MiddlewareKeyedLocks(
	GLOBAL_WEB_KEYED_LOCKS,
	(key) => "tws-abook-player/" + key
)

export class AbookWriteAccess {
	private isReleased = false

	constructor(
		private readonly db: AbookDB,
		private abook: Abook,
		private readonly releaser: () => void
	) {}

	/**
	 * Note: user of this function MUST NOT drop locally stored entries
	 */
	private innerUpdate = async (mutator: (draft: Draft<Abook>) => void) => {
		this.checkReleased()

		const newAbook = produce(this.abook, (draft) => {
			mutator(draft)
		})

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
				const internalEntries = this.abook.entries
					.map((v) =>
						v.data.dataType === FileEntryType.INTERNAL_FILE
							? v.data.internalFileId
							: undefined
					)
					.filter((v) => typeof v === "string")

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
		this.checkReleased()

		const newAbook = produce(this.abook, (draft) => {
			mutator(draft)
		})

		const oldAbookLocalFiles = new Set(
			this.abook.entries
				.map((v) =>
					v.data.dataType === FileEntryType.INTERNAL_FILE
						? v.data.internalFileId
						: undefined
				)
				.filter((v) => typeof v === "string")
		)
		const newAbookLocalFiles = new Set(
			newAbook.entries
				.map((v) =>
					v.data.dataType === FileEntryType.INTERNAL_FILE
						? v.data.internalFileId
						: undefined
				)
				.filter((v) => typeof v === "string")
		)

		const eqSet = <T>(xs: Set<T>, ys: Set<T>) =>
			xs.size === ys.size && [...xs].every((x) => ys.has(x))

		if (eqSet(oldAbookLocalFiles, newAbookLocalFiles))
			throw new Error(
				`Old and new Abook local file sets have changed during update`
			)

		await this.db.abooks.put(newAbook)

		this.abook = newAbook
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

	appendInternalFile = async (blob: Blob | File, name?: string) => {
		this.checkReleased()

		name = name || (blob instanceof File ? blob.name : name)
		if (!name)
			throw new Error("Name was not provided for new internal file")
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

				await this.innerUpdate((draft) => {
					draft.entries.push({
						name:
							name ??
							throwExpression(new Error("Name must be provided")),
						cachedData: {
							disposition: AbookFileDisposition.NOT_LOADED,
							size: blob.size,
						},
						data: {
							dataType: FileEntryType.INTERNAL_FILE,
							internalFileId: internalFileId,
						},
					})
				})
			}
		)
	}

	private checkReleased = () => {
		// TODO: check here
	}

	release = () => {
		this.isReleased = true
		this.releaser()
	}
}

export class AbookDB extends Dexie {
	abooks!: Table<Abook, string>
	internalFiles!: Table<InternalFile, string>

	public readonly locks = AbookDBLock

	private constructor() {
		super("tws-abook/abook-db")
		this.version(1).stores({
			abooks: "id",
			fileEntries: "id,ownerType,ownerId,[ownerType+ownerId]",
		})
	}

	public static readonly instance = new AbookDB()

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
     */
	getInternalFileBlob = async (id: string): Promise<Blob | File | null> => {
		const file = (await this.internalFiles.get(id)) ?? null
		return file?.blob ?? null
	}
}

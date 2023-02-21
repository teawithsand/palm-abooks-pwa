import { PositionType, PositionVariants } from "@app/domain/defines/position"
import {
	PlayerEntryListMetadata,
	PlayerEntryListMetadataType,
} from "@app/domain/managers/newPlayer/list/metadata"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { FileEntryEntityPlayerSource } from "@app/domain/managers/newPlayer/source/source"
import { AbookDb } from "@app/domain/storage/db"
import { IntervalHelper } from "@app/util/IntervalHelper"
import { Lock, MutexLockAdapter, getNowTimestamp } from "@teawithsand/tws-stl"

// HACK(teawithsand): this should be removed, in fact even now it's here just in case

const GLOBAL_SAVE_LOCK = new Lock(new MutexLockAdapter())

export function objectEquals(x: any, y: any): boolean {
	"use strict"

	if (x === null || x === undefined || y === null || y === undefined) {
		return x === y
	}
	// after this just checking type of one would be enough
	if (x.constructor !== y.constructor) {
		return false
	}
	// if they are functions, they should exactly refer to same one (because of closures)
	if (x instanceof Function) {
		return x === y
	}
	// if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
	if (x instanceof RegExp) {
		return x === y
	}
	if (x === y || x.valueOf() === y.valueOf()) {
		return true
	}
	if (Array.isArray(x) && x.length !== y.length) {
		return false
	}

	// if they are dates, they must had equal valueOf
	if (x instanceof Date) {
		return false
	}

	// if they are strictly equal, they both need to be object at least
	if (!(x instanceof Object)) {
		return false
	}
	if (!(y instanceof Object)) {
		return false
	}

	// recursive object equality check
	var p = Object.keys(x)
	return (
		Object.keys(y).every(function (i) {
			return p.indexOf(i) !== -1
		}) &&
		p.every(function (i) {
			return objectEquals(x[i], y[i])
		})
	)
}

export class PlayerPositionSaver {
	private readonly intervalHelper = new IntervalHelper(0)
	private isClosed = false
	private isPositionWritten = false
	private lastSavedPosition: PositionVariants = {}
	private currentPosition: PositionVariants = {}

	constructor(
		private readonly entriesBag: PlayerEntriesBag,
		private readonly metadata: PlayerEntryListMetadata,
		private readonly abookDb: AbookDb
	) {
		this.intervalHelper.setDelay(10 * 1000)
		this.intervalHelper.bus.addSubscriber(() => this.maybeWritePosition())
	}

	setPosition = (entryId: string | null, positionMs: number | null) => {
		if (this.isClosed) return
		if (entryId === null || positionMs === null) return

		const entry = this.entriesBag.findById(entryId)
		if (!entry) return

		if (entry.source instanceof FileEntryEntityPlayerSource) {
			this.currentPosition[PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET] =
				{
					type: PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET,
					fileEntityId: entry.source.entry.id,
					positionMs: positionMs,
				}
		}

		const fileName = entry.fileName
		if (fileName) {
			this.currentPosition[PositionType.FILE_NAME_AND_LOCAL_OFFSET] = {
				type: PositionType.FILE_NAME_AND_LOCAL_OFFSET,
				fileName: fileName,
				positionMs: positionMs,
			}
		}

		const index = this.entriesBag.findIndexById(entry.id)
		if (index !== null) {
			const durationToIndex =
				this.entriesBag.metadataBag.getDurationToIndex(index)
			if (durationToIndex !== null) {
				this.currentPosition[PositionType.GLOBAL_OFFSET] = {
					type: PositionType.GLOBAL_OFFSET,
					positionMs: durationToIndex + positionMs,
				}
			}
		}

		this.isPositionWritten = false
	}

	requestImmediateSave = () => {
		if (this.isClosed) return
		this.intervalHelper.trigger()
	}

	private maybeWritePosition = async () => {
		if (this.isClosed) return
		await GLOBAL_SAVE_LOCK.withLock(async () => {
			if (this.isPositionWritten) return

			if (
				!this.currentPosition[
					PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET
				] ||
				!this.currentPosition[
					PositionType.FILE_NAME_AND_LOCAL_OFFSET
				] ||
				!this.currentPosition[PositionType.GLOBAL_OFFSET]
			) {
				return
			}

			// Do not save position, if it didn't change
			if (objectEquals(this.lastSavedPosition, this.currentPosition)) {
				this.isPositionWritten = true
				return
			}

			this.lastSavedPosition = this.currentPosition
			await this.innerWritePositionNoLock(this.currentPosition)
			this.isPositionWritten = true
		})
	}

	private innerWritePositionNoLock = async (position: PositionVariants) => {
		if (this.metadata.data.type === PlayerEntryListMetadataType.ABOOK) {
			await this.abookDb.runWithAbookWriteAccess(
				this.metadata.data.abook.id,
				async (write) => {
					await write.update((draft) => {
						draft.position = {
							savedTimestamp: getNowTimestamp(),
							variants: position,
						}
					})
				}
			)
		}
	}

	close = () => {
		if (this.isClosed) return
		this.isClosed = true

		this.intervalHelper.disable()
	}
}

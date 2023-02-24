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
import { isSsr } from "@teawithsand/tws-stl-react"

// TODO(teawithsand): make some better initialization trick
const GLOBAL_SAVE_LOCK: Lock = isSsr() ? null as any as Lock : new Lock(new MutexLockAdapter())

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

	private isPositionWritten = false
	private lastSavedPosition: PositionVariants = {}
	private currentPosition: PositionVariants = {}

	private loadedPosition: boolean = false

	private entriesBag: PlayerEntriesBag = new PlayerEntriesBag([])
	private metadata: PlayerEntryListMetadata = new PlayerEntryListMetadata({
		type: PlayerEntryListMetadataType.UNKNOWN,
	})

	constructor(private readonly abookDb: AbookDb) {
		this.intervalHelper.bus.addSubscriber(() => this.maybeWritePosition())
	}

	setState = (
		entryId: string | null,
		positionMs: number | null,
		entriesBag: PlayerEntriesBag,
		metadata: PlayerEntryListMetadata,
		loadedPosition: boolean
	) => {
		let enableInterval = false
		if (!loadedPosition) {
			this.intervalHelper.disable()
		} else {
			if (!this.loadedPosition) {
				enableInterval = true
			}
		}

		this.loadedPosition = loadedPosition

		this.entriesBag = entriesBag
		if (this.metadata.id !== metadata.id) {
			// metadata id change
			// invalidate any previous position state
			// 'cause we are writing to new location
			this.currentPosition = {}
			this.lastSavedPosition = {}
			this.isPositionWritten = false
			this.metadata = metadata
		}

		this.setPosition(entryId, positionMs)

		if (enableInterval) {
			this.intervalHelper.setDelay(10 * 1000)
		}
	}

	private setPosition = (
		entryId: string | null,
		positionMs: number | null
	) => {
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
		if (!this.loadedPosition) return
		this.maybeWritePosition()
	}

	private maybeWritePosition = async () => {
		await GLOBAL_SAVE_LOCK.withLock(async () => {
			try {
				if (!this.loadedPosition) return
				if (this.isPositionWritten) return

				const anyPositionNotLoaded =
					!this.currentPosition[
						PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET
					] ||
					!this.currentPosition[
						PositionType.FILE_NAME_AND_LOCAL_OFFSET
					] ||
					!this.currentPosition[PositionType.GLOBAL_OFFSET]

				if (anyPositionNotLoaded) {
					return
				}

				// Do not save position, if it didn't change
				if (
					objectEquals(this.lastSavedPosition, this.currentPosition)
				) {
					this.isPositionWritten = true
					return
				}

				this.lastSavedPosition = { ...this.currentPosition }
				await this.innerWritePositionNoLock({
					...this.currentPosition,
				})
				this.isPositionWritten = true
			} catch (e) {
				console.error("Filed to save position", e)
			}
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
}

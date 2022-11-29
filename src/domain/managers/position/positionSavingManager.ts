import { AbookId } from "@app/domain/defines/abook"
import { PlayableEntryType } from "@app/domain/defines/player/playableEntry"
import { PositionType, PositionVariants } from "@app/domain/defines/position"
import { WhatToPlayData } from "@app/domain/defines/whatToPlay/data"
import { WhatToPlayLocatorType } from "@app/domain/defines/whatToPlay/locator"
import { WhatToPlayStateType } from "@app/domain/defines/whatToPlay/state"
import {
	PlayerManager,
	PlayerManagerState,
} from "@app/domain/managers/playerManager"
import {
	PositionLoadingManager,
	PositionLoadingManagerStateType,
} from "@app/domain/managers/position/positionLoadingManager"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"
import { IntervalHelper } from "@app/util/IntervalHelper"
import { getTimestamps, Timestamps } from "@app/util/timestamps"
import { isTimeNumber } from "@teawithsand/tws-player"
import {
	DefaultEventBus,
	generateUUID,
	Lock,
	MutexLockAdapter,
	Subscribable,
	throwExpression,
} from "@teawithsand/tws-stl"

type ValidPlayerPosition = {
	id: string
	position: PositionVariants

	createTimestamps: Timestamps
}

export type PositionManagerSuccessfullySavedPosition = {
	position: PositionVariants
	positionCreateTimestamps: Timestamps
	operationTimestamps: Timestamps
}

export enum PositionSavingManagerEventType {
	PENDING = 0,
	SUCCESS = 1,
	ERROR = 2,
}
export type PositionSavingManagerEvent = {
	whatToPlayDataId: string
	// For now just disable it
	// /**
	//  * In given what-to-play-data session that is.
	//  */
	// lastSuccessfullySavedPosition: PositionManagerSuccessfullySavedPosition | null
} & (
	| {
			type: PositionSavingManagerEventType.PENDING
	  }
	| {
			type: PositionSavingManagerEventType.SUCCESS
	  }
	| {
			type: PositionSavingManagerEventType.ERROR
			error: any
	  }
)

export class PositionSavingManager {
	private readonly innerBus =
		new DefaultEventBus<PositionSavingManagerEvent>()

	get bus(): Subscribable<PositionSavingManagerEvent> {
		return this.innerBus
	}

	private readonly positionSaveInterval = 2000

	private whatToPlayData: WhatToPlayData | null = null
	private playerManagerState: PlayerManagerState | null = null
	private lastValidPlayerPosition: ValidPlayerPosition | null = null

	private readonly intervalHelper = new IntervalHelper(0)

	private readonly mutex = new Lock(new MutexLockAdapter())

	private finishedPositionLoading = false

	constructor(
		private readonly db: AbookDb,
		wtpManager: WhatToPlayManager,
		playerManager: PlayerManager,
		positionLoadingManager: PositionLoadingManager
	) {
		this.intervalHelper.bus.addSubscriber(() => {
			this.triggerPositionSave()
		})

		positionLoadingManager.bus.addSubscriber((state) => {
			this.finishedPositionLoading = [
				PositionLoadingManagerStateType.ERROR, // in that case do override
				PositionLoadingManagerStateType.NOT_FOUND,
				PositionLoadingManagerStateType.LOADED,
			].includes(state.type)
		})

		wtpManager.stateBus.addSubscriber((state) => {
			const data =
				state.type === WhatToPlayStateType.LOADED ? state.data : null

			const changed = data?.id !== this.whatToPlayData?.id
			if (changed && this.whatToPlayData !== null) {
				// TODO(teawithsand): for numerous reasons it's really bad
				// it would be much simpler to trigger position save and then kill player
				this.onBeforeWtpDataUnset() // still we can run something on old WTP data
			}

			this.whatToPlayData = data

			if (changed) {
				// make sure we use updated player state, even though
				// it does not fix that problem, it's just a heuristic.
				this.playerManagerState = null
				this.lastValidPlayerPosition = null // this is required though
			}

			this.updateLastValidPosition()

			if (changed) {
				this.finishedPositionLoading = [
					PositionLoadingManagerStateType.ERROR, // in that case do override
					PositionLoadingManagerStateType.NOT_FOUND,
					PositionLoadingManagerStateType.LOADED,
				].includes(positionLoadingManager.bus.lastEvent.type)

				if (data) {
					this.intervalHelper.setDelay(this.positionSaveInterval)
				} else {
					this.intervalHelper.disable()
				}
			}
		})

		playerManager.playerStateBus.addSubscriber((state) => {
			let requestImmediateSave = false

			requestImmediateSave =
				requestImmediateSave ||
				this.playerManagerState?.innerState.config.sourceKey !==
					state.innerState.config.sourceKey

			requestImmediateSave =
				requestImmediateSave ||
				this.playerManagerState?.innerState.config.sourceProvider !==
					state.innerState.config.sourceProvider

			requestImmediateSave =
				requestImmediateSave ||
				(this.playerManagerState?.innerState.config.seekPosition !==
					null &&
					state.innerState.config.seekPosition === null)

			this.playerManagerState = state
			this.updateLastValidPosition()

			// Here are some special save file conditions
			if (requestImmediateSave) this.triggerPositionSave()
		})
	}

	private onBeforeWtpDataUnset = () => {
		this.triggerPositionSave(true)
	}

	private updateLastValidPosition = () => {
		const candidate = this.tryMakeValidPlayerPosition()
		this.lastValidPlayerPosition = candidate
			? candidate
			: this.lastValidPlayerPosition
	}

	private tryMakePositionVariants = (): PositionVariants | null => {
		const {
			position = null,
			config: { sourceKey = null, sourceProvider = null },
		} = this.playerManagerState?.innerState ?? {
			config: {},
		}

		const whatToPlay = this.whatToPlayData

		// TODO(teawithsand): once it becomes implemented: check if what to play data's id is reflected in player manager state
		if (
			!isTimeNumber(position) ||
			position === null ||
			sourceKey === null ||
			sourceProvider === null ||
			whatToPlay === null ||
			!this.finishedPositionLoading
		)
			return null

		// Do not yield zero position, as it's default anyway
		if (
			position === 0 &&
			sourceKey === sourceProvider.getNextSourceKey(null)
		)
			return null

		const currentEntry =
			whatToPlay.entriesBag.findById(sourceKey) ??
			throwExpression(
				new Error(
					"Unreachable - player has currentEntry, which was not provided in player"
				)
			)
		const currentEntryIndex =
			whatToPlay.entriesBag.findIndexById(sourceKey) ??
			throwExpression(new Error("Unreachable code"))

		const variants: PositionVariants = {}

		if (currentEntry.type === PlayableEntryType.FILE_ENTRY) {
			variants[PositionType.FILE_ID_AND_LOCAL_OFFSET] = {
				type: PositionType.FILE_ID_AND_LOCAL_OFFSET,
				fileId: currentEntry.entry.id,
				positionMs: position,
			}
			variants[PositionType.FILE_NAME_AND_LOCAL_OFFSET] = {
				type: PositionType.FILE_NAME_AND_LOCAL_OFFSET,
				fileName: currentEntry.entry.metadata.name,
				positionMs: position,
			}
		}

		const prefixDuration =
			whatToPlay.metadata.getDurationToIndex(currentEntryIndex)
		if (
			isTimeNumber(prefixDuration) &&
			prefixDuration !== null &&
			position !== null
		) {
			variants[PositionType.GLOBAL_OFFSET] = {
				type: PositionType.GLOBAL_OFFSET,
				positionMs: prefixDuration + position,
			}
		}

		return [...Object.keys(variants)].length > 0 ? variants : null
	}

	private tryMakeValidPlayerPosition = (): ValidPlayerPosition | null => {
		const now = getTimestamps()
		const pos = this.tryMakePositionVariants()
		if (pos) {
			return {
				createTimestamps: now,
				id: generateUUID(),
				position: pos,
			}
		} else {
			return null
		}
	}

	/**
	 * Locks on to lastValidPlayerPosition and starts process of saving it.
	 */
	private triggerPositionSave = (ignoreIfNotLoaded = false) => {
		const { lastValidPlayerPosition, whatToPlayData } = this
		if (
			lastValidPlayerPosition &&
			whatToPlayData &&
			(this.finishedPositionLoading || ignoreIfNotLoaded)
		) {
			this.innerBus.emitEvent({
				type: PositionSavingManagerEventType.PENDING,
				whatToPlayDataId: whatToPlayData.id,
			})
			;(async () => {
				let isError = false
				let error = null
				try {
					await this.savePosition(
						lastValidPlayerPosition,
						whatToPlayData
					)
				} catch (e) {
					error = e
				}

				if (isError) {
					this.innerBus.emitEvent({
						type: PositionSavingManagerEventType.ERROR,
						error,
						whatToPlayDataId: whatToPlayData.id,
					})
				} else {
					this.innerBus.emitEvent({
						type: PositionSavingManagerEventType.SUCCESS,
						whatToPlayDataId: whatToPlayData.id,
					})
				}
			})()
		}
	}

	public suggestPositionSave = () => {
		this.triggerPositionSave()
	}

	private savePosition = async (
		pos: ValidPlayerPosition,
		data: WhatToPlayData
	) =>
		await this.mutex.withLock(async () => {
			const { locator } = data

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
						draft.position = pos.position
					})
				} finally {
					writeAccess.release()
				}
			}
		})
}

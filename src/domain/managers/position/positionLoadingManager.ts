import { PlayableEntryType } from "@app/domain/defines/player/playableEntry"
import {
	Position,
	PositionType,
	PositionVariants,
} from "@app/domain/defines/position"
import { SeekData, SeekType } from "@app/domain/defines/seek"
import {
	WhatToPlayData,
	WhatToPlayDataType,
} from "@app/domain/defines/whatToPlay/data"
import { WhatToPlayStateType } from "@app/domain/defines/whatToPlay/state"
import { PlayerActionManager } from "@app/domain/managers/playerActionsManager"
import {
	PlayerManager,
	PlayerManagerState,
} from "@app/domain/managers/playerManager"
import { PositionMoveAfterPauseManager } from "@app/domain/managers/position/positionMoveAfterPauseManager"
import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
import { isTimeNumber } from "@teawithsand/tws-player"
import { DefaultStickyEventBus, StickySubscribable } from "@teawithsand/tws-stl"

export enum PositionLoadingManagerStateType {
	IDLE = -1,
	LOADING = 0,
	LOADED = 1,
	NOT_FOUND = 2,
	ERROR = 3,
}

export type PositionLoadingManagerState =
	| {
			type: PositionLoadingManagerStateType.IDLE
	  }
	| {
			type: PositionLoadingManagerStateType
			whatToPlayDataId: string
	  }

export class PositionLoadingManager {
	private whatToPlayData: WhatToPlayData | null = null

	private readonly innerBus =
		new DefaultStickyEventBus<PositionLoadingManagerState>({
			type: PositionLoadingManagerStateType.IDLE,
		})

	get bus(): StickySubscribable<PositionLoadingManagerState> {
		return this.innerBus
	}

	private waitingForPositionLoad = false
	private isPlayerReady = false

	private checkIsPlayerReady = (playerManagerState: PlayerManagerState) => {
		return false
	}

	constructor(
		wtpManager: WhatToPlayManager,
		playerManager: PlayerManager,
		private readonly playerActions: PlayerActionManager,
		private readonly positionMoveAfterPauseManager: PositionMoveAfterPauseManager
	) {
		playerManager.playerStateBus.addSubscriber((state) => {
			this.isPlayerReady = this.checkIsPlayerReady(state)
		})

		wtpManager.stateBus.addSubscriber((state) => {
			const data =
				state.type === WhatToPlayStateType.LOADED ? state.data : null

			const changed = data?.id !== this.whatToPlayData?.id

			this.whatToPlayData = data

			if (changed) {
				this.isPlayerReady = this.checkIsPlayerReady(
					playerManager.playerStateBus.lastEvent
				)

				if (this.whatToPlayData) {
					this.innerBus.emitEvent({
						type: PositionLoadingManagerStateType.LOADING,
						whatToPlayDataId: this.whatToPlayData.id,
					})
				} else {
					this.innerBus.emitEvent({
						type: PositionLoadingManagerStateType.IDLE,
					})
				}
				this.loadPosition()
			}
		})
	}

	private loadPosition = () => {
		if (!this.whatToPlayData) return

		if (this.whatToPlayData.type === WhatToPlayDataType.ABOOK) {
			const pos = this.whatToPlayData.abook.position
			if (pos) {
				const sd = this.positionVariantsToSeekData(
					this.whatToPlayData,
					pos
				)
				if (sd) {
					const delta =
						this.positionMoveAfterPauseManager.computeJumpBackTimeForPastPlayed(
							null
						)
					this.playerActions.seek(sd)

					// TODO(teawithsand): implement jumping back after pause here
					// this is used for on-before-playing-started configurations
					if (isTimeNumber(delta)) {
						this.playerActions.seek({
							type: SeekType.RELATIVE_GLOBAL,
							positionDeltaMs: -delta,
						})
					}
					this.innerBus.emitEvent({
						type: PositionLoadingManagerStateType.LOADED,
						whatToPlayDataId: this.whatToPlayData.id,
					})
				} else {
					this.innerBus.emitEvent({
						type: PositionLoadingManagerStateType.ERROR,
						whatToPlayDataId: this.whatToPlayData.id,
					})
				}
			} else {
				this.innerBus.emitEvent({
					type: PositionLoadingManagerStateType.NOT_FOUND,
					whatToPlayDataId: this.whatToPlayData.id,
				})
			}
		} else {
			this.innerBus.emitEvent({
				type: PositionLoadingManagerStateType.NOT_FOUND,
				whatToPlayDataId: this.whatToPlayData.id,
			})
		}
	}

	private positionToSeekData = (
		data: WhatToPlayData,
		position: Position
	): SeekData | null => {
		if (position.type === PositionType.FILE_ID_AND_LOCAL_OFFSET) {
			const entry = data.entriesBag.findById(position.fileId)
			if (!entry) return null

			return {
				type: SeekType.ABSOLUTE_TO_FILE,
				playableEntryId: position.fileId,
				positionMs: position.positionMs,
			}
		} else if (position.type === PositionType.FILE_NAME_AND_LOCAL_OFFSET) {
			const targetEntry = data.entriesBag.entries.find(
				(e) =>
					e.type === PlayableEntryType.FILE_ENTRY &&
					e.entry.metadata.name === position.fileName
			)
			if (!targetEntry) return null

			return {
				type: SeekType.ABSOLUTE_TO_FILE,
				playableEntryId: targetEntry.id,
				positionMs: position.positionMs,
			}
		} else if (position.type === PositionType.GLOBAL_OFFSET) {
			return {
				type: SeekType.ABSOLUTE_GLOBAL,
				positionMs: position.positionMs,
			}
		} else {
			throw new Error("Unreachable code")
		}
	}

	private positionVariantsToSeekData = (
		data: WhatToPlayData,
		position: PositionVariants
	): SeekData | null => {
		const variants: PositionType[] = [
			PositionType.FILE_ID_AND_LOCAL_OFFSET,
			PositionType.FILE_NAME_AND_LOCAL_OFFSET,
			PositionType.GLOBAL_OFFSET,
		]

		for (const v of variants) {
			const candidate = position[v]
			if (!candidate) continue
			const res = this.positionToSeekData(data, candidate)
			if (res) return res
		}

		return null
	}
}

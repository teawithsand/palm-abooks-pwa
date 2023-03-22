import { SeekBackStrategyEntity } from "@app/domain/defines/player/seekBack/strategy"
import {
	Position,
	PositionType,
	PositionVariants,
} from "@app/domain/defines/position"
import {
	SeekData,
	SeekDiscardCondition,
	SeekType,
} from "@app/domain/defines/seek"
import { PlayerEntryListMetadata } from "@app/domain/managers/newPlayer/list/metadata"
import {
	NewSeekQueue,
	SeekEvent,
	SeekEventType,
} from "@app/domain/managers/newPlayer/player/seekQueue"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { FileEntryEntityPlayerSource } from "@app/domain/managers/newPlayer/source/source"
import {
	DefaultStickyEventBus,
	PerformanceTimestampMs,
	StickyEventBus,
	StickySubscribable,
	generateUUID,
	getNowPerformanceTimestamp,
} from "@teawithsand/tws-stl"

export enum PositionLoadingState {
	LOADING = 1,
	LOADED = 2,
	NOT_FOUND = 3,
	ERROR = 4,
}

export type PlayerPositionLoaderState = {
	state: PositionLoadingState
}

export class PlayerPositionLoader {
	private readonly innerBus: StickyEventBus<PlayerPositionLoaderState>
	private isClosed = false

	get bus(): StickySubscribable<PlayerPositionLoaderState> {
		return this.innerBus
	}

	constructor(
		private readonly metadata: PlayerEntryListMetadata,
		private readonly entriesBag: PlayerEntriesBag,
		private readonly seekBackEntity: SeekBackStrategyEntity
	) {
		const position = metadata.positionToLoad
		this.innerBus = new DefaultStickyEventBus<PlayerPositionLoaderState>(
			position
				? {
						state: PositionLoadingState.LOADING,
				  }
				: {
						state: PositionLoadingState.NOT_FOUND,
				  }
		)
	}

	private resolvePosition = (position: Position): SeekData | null => {
		if (position.type === PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET) {
			const entry = this.entriesBag.findByFileEntryEntityId(
				position.fileEntityId
			)
			if (!entry) return null

			return {
				type: SeekType.ABSOLUTE_TO_FILE,
				playerEntryId: entry.id,
				positionMs: position.positionMs,
			}
		} else if (position.type === PositionType.FILE_NAME_AND_LOCAL_OFFSET) {
			const targetEntry = this.entriesBag.entries.find(
				(e) =>
					e.source instanceof FileEntryEntityPlayerSource &&
					e.fileName === position.fileName
			)
			if (!targetEntry) return null

			return {
				type: SeekType.ABSOLUTE_TO_FILE,
				playerEntryId: targetEntry.id,
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

	private resolvePositionVariants = (
		position: PositionVariants
	): SeekData | null => {
		const variants: PositionType[] = [
			PositionType.FILE_ENTITY_ID_AND_LOCAL_OFFSET,
			PositionType.FILE_NAME_AND_LOCAL_OFFSET,
			PositionType.GLOBAL_OFFSET,
		]

		for (const v of variants) {
			const candidate = position[v]
			if (!candidate) continue
			const res = this.resolvePosition(candidate)
			if (res) return res
		}

		return null
	}

	private safeSend = (state: PlayerPositionLoaderState) => {
		if (this.isClosed) return
		this.innerBus.emitEvent(state)
	}

	begin = (seekQueue: NewSeekQueue) => {
		if (this.isClosed) return

		const position = this.metadata.positionToLoad
		const lastPlayedTimestamp = this.metadata.lastPlayedTimestamp
		if (!position) {
			this.safeSend({
				state: PositionLoadingState.NOT_FOUND,
			})
			return
		}
		const targetPositionSeek = this.resolvePositionVariants(position)
		if (!targetPositionSeek) {
			this.safeSend({
				state: PositionLoadingState.ERROR,
			})
			return
		}

		const jumpBackSeek: SeekData = lastPlayedTimestamp
			? {
					type: SeekType.RELATIVE_GLOBAL,
					positionDeltaMs:
						-this.seekBackEntity.computeTimestampBasedJumpBackTime(
							lastPlayedTimestamp
						),
			  }
			: {
					type: SeekType.RELATIVE_IN_FILE,
					positionDeltaMs: 0,
			  }

		let loadPositionSeekResult: SeekEvent | null = null
		let jumpBackSeekResult: SeekEvent | null = null

		const checkCond = () => {
			if (loadPositionSeekResult && jumpBackSeekResult) {
				const isFiled =
					loadPositionSeekResult.type !== SeekEventType.PERFORMED

				this.safeSend({
					state: isFiled
						? PositionLoadingState.ERROR
						: PositionLoadingState.LOADED,
				})
			}
		}

		seekQueue
			.enqueueSeek({
				id: generateUUID(),
				deadlinePerfTimestamp: (getNowPerformanceTimestamp() +
					2000) as PerformanceTimestampMs,
				seekData: targetPositionSeek,
				discardCond: SeekDiscardCondition.NEVER,
			})
			.addSubscriber((event, cancel) => {
				loadPositionSeekResult = loadPositionSeekResult || event
				if (event) cancel()
				checkCond()
			})
		seekQueue
			.enqueueSeek({
				id: generateUUID(),
				deadlinePerfTimestamp: (getNowPerformanceTimestamp() +
					2000 +
					2000) as PerformanceTimestampMs,
				seekData: jumpBackSeek,
				discardCond: SeekDiscardCondition.NEVER,
			})
			.addSubscriber((event, cancel) => {
				jumpBackSeekResult = jumpBackSeekResult || event
				if (event) cancel()
				checkCond()
			})
	}

	close = () => {
		if (!this.isClosed) {
			this.isClosed = true
		}
	}
}

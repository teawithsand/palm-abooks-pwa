import {
	AbsoluteSeekData,
	ExtendedSeekData,
	SeekData,
	SeekDiscardCondition,
	SeekType,
	TrivialSeekData,
} from "@app/domain/defines/seek"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { IntervalHelper } from "@app/util/IntervalHelper"
import { Queue } from "@app/util/queue"
import { Player } from "@teawithsand/tws-player"
import {
	DefaultEventBus,
	DefaultStickyEventBus,
	StickySubscribable,
	Subscribable,
	getNowPerformanceTimestamp,
	throwExpression,
} from "@teawithsand/tws-stl"

const DELAY = 10

export enum SeekEventType {
	PERFORMED = 1,
	DISCARDED_TIMEOUT = 2,
	DISCARDED_CONDITION_FILED = 3,
	DISCARDED_CANT_PERFORM_INSTANTLY = 4,
}

export type SeekEvent = {
	data: ExtendedSeekData
} & (
	| {
			type: SeekEventType.PERFORMED
	  }
	| {
			type: SeekEventType.DISCARDED_TIMEOUT
	  }
	| {
			type: SeekEventType.DISCARDED_CANT_PERFORM_INSTANTLY
	  }
	| {
			type: SeekEventType.DISCARDED_CONDITION_FILED
	  }
)

export type NewSeekQueueResolutionData = {
	currentEntryId: string | null
	currentEntryPosition: number | null
	entriesBag: PlayerEntriesBag
}

export class NewSeekQueue {
	private readonly queue: Queue<ExtendedSeekData> = new Queue()

	// HACK(teawithsand): While it's particularity bad way of doing this
	// it should work for now.
	//
	// In future proper monitoring of player state should be implemented.
	private readonly intervalHelper = new IntervalHelper(10)

	private readonly resolutionDataBus =
		new DefaultStickyEventBus<NewSeekQueueResolutionData>({
			currentEntryId: null,
			currentEntryPosition: null,
			entriesBag: new PlayerEntriesBag([]),
		})

	setResolutionData = (rd: NewSeekQueueResolutionData) => {
		this.resolutionDataBus.emitEvent(rd)
	}

	constructor(
		private readonly player: Player,
		private readonly onFileChangingSeek: (sourceId: string) => void
	) {
		this.intervalHelper.disable()

		this.intervalHelper.bus.addSubscriber(() => {
			this.tryApplySeekData()
		})
	}

	private get playerState() {
		return this.player.stateBus.lastEvent
	}

	clear = () => {
		while (!this.queue.isEmpty) {
			const v =
				this.queue.pop() ??
				throwExpression(new Error(`Unreachable code`))

			// discard these
			this.innerBus.emitEvent({
				type: SeekEventType.DISCARDED_TIMEOUT,
				data: v,
			})
		}
	}

	get queueLength(): number {
		return this.queue.length
	}

	enqueueSeek = (
		seek: ExtendedSeekData,
		overridePrevious = false
	): StickySubscribable<SeekEvent | null> => {
		if (overridePrevious) {
			this.clear()
		}

		const bus = new DefaultStickyEventBus<SeekEvent | null>(null)
		this.innerBus.addSubscriber((s, unsubscribe) => {
			if (s.data.id === seek.id) {
				unsubscribe()

				bus.emitEvent(s)
			}
		})

		this.queue.push(seek)
		this.tryApplySeekData()

		return bus
	}

	private innerBus = new DefaultEventBus<SeekEvent>()

	public get bus(): Subscribable<SeekEvent> {
		return this.innerBus
	}

	private resolveSeekData = (sd: SeekData): TrivialSeekData | null => {
		const { currentEntryId, currentEntryPosition, entriesBag } =
			this.resolutionDataBus.lastEvent
		let absoluteSeek: AbsoluteSeekData

		if (sd.type === SeekType.RELATIVE_GLOBAL) {
			if (currentEntryId === null || currentEntryPosition === null)
				return null
			const currentEntryIndex = entriesBag.findIndexById(currentEntryId)
			if (currentEntryIndex === null) return null
			const durationToIndex =
				entriesBag.metadataBag.getDurationToIndex(currentEntryIndex)
			if (durationToIndex === null) return null

			let absolutePosition =
				durationToIndex + currentEntryPosition + sd.positionDeltaMs
			if (absolutePosition < 0) absolutePosition = 0

			absoluteSeek = {
				type: SeekType.ABSOLUTE_GLOBAL,
				positionMs: absolutePosition,
			}
		} else if (sd.type === SeekType.RELATIVE_IN_FILE) {
			if (currentEntryPosition === null) return null
			let absolutePosition = currentEntryPosition + sd.positionDeltaMs
			if (absolutePosition < 0) absolutePosition = 0

			return {
				playerEntryId: null,
				positionMs: absolutePosition,
			}
		} else {
			absoluteSeek = sd
		}

		return entriesBag.resolveAbsoluteSeek(absoluteSeek)
	}

	private tryApplySeekData = () => {
		const playerState = this.playerState
		const bag = this.resolutionDataBus.lastEvent.entriesBag
		const now = getNowPerformanceTimestamp()
		try {
			for (;;) {
				const sd = this.queue.peek()
				if (!sd) break

				let emittedEvent = false
				const notifyPerformed = (pop: boolean = true) => {
					if (emittedEvent) return
					emittedEvent = true

					if (pop) this.queue.pop()
					this.innerBus.emitEvent({
						type: SeekEventType.PERFORMED,
						data: sd,
					})
				}
				const discard = (reason: SeekEventType) => {
					if (emittedEvent) return
					emittedEvent = true

					this.queue.pop()
					this.innerBus.emitEvent({
						type: reason,
						data: sd,
					})
				}

				// used to make sure that seek won't block queue for too long
				if (
					sd.deadlinePerfTimestamp !== null &&
					now > sd.deadlinePerfTimestamp
				) {
					discard(SeekEventType.DISCARDED_TIMEOUT)
					continue
				}

				const resolved = this.resolveSeekData(sd.seekData)

				let entry: PlayerEntry | null = null

				// HACK: do not seek to id that's not found in a same way that it's in-current-file seek
				let filedToLoad = false
				if (resolved && resolved.playerEntryId) {
					entry = bag.findById(resolved.playerEntryId)
					if (!entry) {
						filedToLoad = true
					}
				}

				const canSeek =
					!bag.isEmpty && // There are some entries that we can operate on
					!!resolved && // Succeeded to resolve seek
					!filedToLoad && // Didn't fail to load entry by it's id
					playerState.positionUpdatedAfterSeek && // Update current position after previous seek
					(!!entry || !!playerState.config.source) // Either: current entry is set or we will set one

				const conditionPassed =
					!canSeek || !sd.immediateExecCond || sd.immediateExecCond()

				if (canSeek && conditionPassed) {
					// this pop has to be there because updating config causes state to recompute, which would enter infinite recursion in that case
					this.queue.pop()

					// TODO(teawithsand): find better way of notifying playerEntryListManager about change of entry, so seek can be performed
					if (entry) {
						this.onFileChangingSeek(entry.id)
					}

					// not the most elegant thing to do(as we get triggered by this state's updates), but will work
					this.player.mutateConfig((draft) => {
						draft.seekPosition = resolved.positionMs
					})

					notifyPerformed(false)
					break // exit seek procedure, another event must trigger next seeking
				} else if (canSeek && !conditionPassed) {
					discard(SeekEventType.DISCARDED_CONDITION_FILED)
					continue
				} else {
					if (sd.discardCond === SeekDiscardCondition.INSTANT) {
						discard(SeekEventType.DISCARDED_CANT_PERFORM_INSTANTLY)
					} else if (
						sd.discardCond === SeekDiscardCondition.NO_METADATA &&
						!resolved // ie. no metadata
					) {
						discard(SeekEventType.DISCARDED_CANT_PERFORM_INSTANTLY)
					} else {
						// exit loop, wait for other event to resolve this seek
						break
					}
				}
			}
		} finally {
			if (!this.queue.isEmpty) {
				// generate some events that may trigger new seek TBD
				this.intervalHelper.setDelay(DELAY, false)
			} else {
				this.intervalHelper.disable()
			}
		}
	}
}

import { RelativeSeekResolutionData } from "@app/domain/defines/player/seek"
import {
	ExtendedSeekData,
	SeekDiscardCondition,
} from "@app/domain/defines/seek"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import {
	PlayerManager,
	PlayerManagerState,
} from "@app/domain/managers/player/playerManager"
import { PositionAndSeekDataResolver } from "@app/domain/managers/position/positionAndSeekDataResolver"
import { IntervalHelper } from "@app/util/IntervalHelper"
import { Queue } from "@app/util/queue"
import { MetadataBag } from "@teawithsand/tws-player"
import {
	DefaultEventBus,
	DefaultStickyEventBus,
	getNowPerformanceTimestamp,
	StickySubscribable,
	Subscribable,
	throwExpression,
} from "@teawithsand/tws-stl"

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

export class SeekQueue {
	private readonly queue: Queue<ExtendedSeekData> = new Queue()

	// HACK(teawithsand): While it's particularity bad way of doing this
	// it should work for now.
	//
	// In future proper monitoring of player state should be implemented.
	private readonly intervalHelper = new IntervalHelper(10)

	constructor(private readonly playerManager: PlayerManager) {
		this.intervalHelper.disable()

		this.intervalHelper.bus.addSubscriber(() => {
			this.tryApplySeekData(playerManager.playerStateBus.lastEvent)
		})

		this.playerManager.playerStateBus.addSubscriber((state) => {
			this.tryApplySeekData(state)
		})
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
		this.tryApplySeekData(this.playerManager.playerStateBus.lastEvent)

		return bus
	}

	private readonly resolver = new PositionAndSeekDataResolver()

	private innerBus = new DefaultEventBus<SeekEvent>()

	public get bus(): Subscribable<SeekEvent> {
		return this.innerBus
	}

	private tryApplySeekData = (state: Readonly<PlayerManagerState>) => {
		const entriesBag =
			state.whatToPlayData?.entriesBag ?? new PlayableEntriesBag([])
		const rd: RelativeSeekResolutionData = {
			currentPosition: state.innerState.position,
			currentSourceKey: state.innerState.config.sourceKey,
			entriesBag: entriesBag, 
			metadataBag:
				state.whatToPlayData?.metadata ??
				// lengths must match
				new MetadataBag(entriesBag.entries.map(() => null)),
		}

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

				const resolved = this.resolver.resolveSeekData(rd, sd.seekData)

				const canSeek =
					!!resolved &&
					state.innerState.config.seekPosition === null &&
					state.innerState.config.sourceProvider !== null &&
					state.innerState.positionUpdatedAfterSeek

				const conditionPassed =
					!canSeek || !sd.immediateExecCond || sd.immediateExecCond()

				if (canSeek && conditionPassed) {
					// this pop has to be there because updating config causes state to recompute, which would enter infinite recursion in that case
					this.queue.pop()

					// not the most elegant thing to do(as we get triggered by this state's updates), but will work
					this.playerManager.mutateConfig((draft) => {
						draft.sourceKey = resolved.playableEntryId
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
				this.intervalHelper.setDelay(10, false)
			} else {
				this.intervalHelper.disable()
			}
		}
	}
}

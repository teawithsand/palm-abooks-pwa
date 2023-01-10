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

		if (seek.deadlinePerfTimestamp !== null) {
			const now = getNowPerformanceTimestamp()
			const delta = seek.deadlinePerfTimestamp - now

			if (isFinite(delta) && delta > 0) {
				const timeoutHandle = setTimeout(() => {
					this.tryApplySeekData(
						this.playerManager.playerStateBus.lastEvent
					)
				}, delta)

				// If SB else executed that event, then do not trigger timeout for it.
				bus.addSubscriber((s, unsubscribe) => {
					if (s === null) return
					unsubscribe()

					clearTimeout(timeoutHandle)
				})
			}
		}

		return bus
	}

	private readonly resolver = new PositionAndSeekDataResolver()

	private innerBus = new DefaultEventBus<SeekEvent>()

	public get bus(): Subscribable<SeekEvent> {
		return this.innerBus
	}

	private tryApplySeekData = (state: Readonly<PlayerManagerState>) => {
		const rd: RelativeSeekResolutionData = {
			currentPosition: state.innerState.position,
			currentSourceKey: state.innerState.config.sourceKey,
			entriesBag:
				state.whatToPlayData?.entriesBag ?? new PlayableEntriesBag([]),
			metadataBag: state.whatToPlayData?.metadata ?? new MetadataBag([]),
		}

		const now = getNowPerformanceTimestamp()
		for (;;) {
			const sd = this.queue.peek()
			if (!sd) break

			let emittedEvent = false
			const notifyPerformed = () => {
				if (emittedEvent) return
				emittedEvent = true

				this.queue.pop()
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
				resolved &&
				state.innerState.config.seekPosition === null &&
				state.innerState.config.sourceProvider !== null

			const conditionPassed = !canSeek || !sd.immediateExecCond || sd.immediateExecCond()

			if (canSeek && conditionPassed) {
				// not the most elegant thing to do, but will work
				this.playerManager.mutateConfig((draft) => {
					draft.sourceKey = resolved.playableEntryId
					draft.seekPosition = resolved.positionMs
				})

				notifyPerformed()
				return // exit seek procedure, another event must trigger next seeking
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
	}

	constructor(private readonly playerManager: PlayerManager) {
		this.playerManager.playerStateBus.addSubscriber((state) => {
			// feed some events to trigger our seeks for stuff like metadata arrived and so on.
			// There could be some filter of events which are meaningful here,
			// but this call is so fast that it's not required.
			this.tryApplySeekData(state)
		})
	}
}

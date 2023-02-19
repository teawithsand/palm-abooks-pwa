import {
	SeekBackStrategyData,
	SeekBackStrategyDataType,
} from "@app/domain/defines/player/seekBack/defines"
import {
	StoredSeekBackStrategy,
	StoredSeekBackStrategyType,
} from "@app/domain/defines/player/seekBack/stored"
import { Serializer } from "@app/util/transform"
import { isTimeNumber } from "@teawithsand/tws-player"
import {
	TimestampMs,
	compareNumbers,
	getNowTimestamp,
} from "@teawithsand/tws-stl"

export class SeekBackStrategyEntity {
	public static readonly Serializer: Serializer<
		SeekBackStrategyEntity,
		StoredSeekBackStrategy
	> = {
		serialize: (entity: SeekBackStrategyEntity) => {
			const serializeData = (
				data: SeekBackStrategyData
			): StoredSeekBackStrategy => {
				if (data.type === SeekBackStrategyDataType.NONE) {
					return {
						type: StoredSeekBackStrategyType.NONE,
					}
				} else if (data.type === SeekBackStrategyDataType.LINEAR) {
					return {
						type: StoredSeekBackStrategyType.LINEAR,
						coefficient: data.coefficient,
						limit: data.limit,
					}
				} else if (data.type === SeekBackStrategyDataType.CONSTANT) {
					return {
						type: StoredSeekBackStrategyType.CONSTANT,
						value: data.value,
					}
				} else if (data.type === SeekBackStrategyDataType.STEPS) {
					return {
						type: StoredSeekBackStrategyType.STEPS,
						fallback: serializeData(data.fallback),
						steps: data.steps.map((v) => ({
							maxSleepTime: v.maxSleepTime,
							strategy: serializeData(v.strategy),
						})),
					}
				} else {
					throw new Error(`Unreachable code`)
				}
			}

			return serializeData(entity.data)
		},
		deserialize: (data: StoredSeekBackStrategy) => {
			const deserializeData = (
				data: StoredSeekBackStrategy
			): SeekBackStrategyData => {
				if (data.type === StoredSeekBackStrategyType.NONE) {
					return {
						type: SeekBackStrategyDataType.NONE,
					}
				} else if (data.type === StoredSeekBackStrategyType.LINEAR) {
					return {
						type: SeekBackStrategyDataType.LINEAR,
						coefficient: data.coefficient,
						limit: data.limit,
					}
				} else if (data.type === StoredSeekBackStrategyType.CONSTANT) {
					return {
						type: SeekBackStrategyDataType.CONSTANT,
						value: data.value,
					}
				} else if (data.type === StoredSeekBackStrategyType.STEPS) {
					return {
						type: SeekBackStrategyDataType.STEPS,
						fallback: deserializeData(data.fallback),
						steps: data.steps.map((v) => ({
							maxSleepTime: v.maxSleepTime,
							strategy: deserializeData(v.strategy),
						})),
					}
				} else {
					throw new Error(`Unreachable code`)
				}
			}

			return new SeekBackStrategyEntity(deserializeData(data))
		},
	}

	private readonly sortedInnerSteps: (SeekBackStrategyData & {
		type: SeekBackStrategyDataType.STEPS
	})["steps"] = []

	constructor(public readonly data: SeekBackStrategyData) {
		if (data.type === SeekBackStrategyDataType.STEPS) {
			this.sortedInnerSteps = [...data.steps]
			this.sortedInnerSteps.sort((a, b) =>
				compareNumbers(a.maxSleepTime, b.maxSleepTime)
			)
		}
	}

	serialize = () => SeekBackStrategyEntity.Serializer.serialize(this)

	private innerComputeJumpBackTime = (pauseDurationMillis: number) => {
		if (!isTimeNumber(pauseDurationMillis) || pauseDurationMillis < 0)
			return 0
		const { data: strategy } = this

		if (strategy.type === SeekBackStrategyDataType.NONE) {
			return 0
		} else if (strategy.type === SeekBackStrategyDataType.LINEAR) {
			return Math.max(
				0,
				Math.min(
					strategy.limit,
					strategy.coefficient * pauseDurationMillis
				)
			)
		} else if (strategy.type === SeekBackStrategyDataType.CONSTANT) {
			return strategy.value
		} else if (strategy.type === SeekBackStrategyDataType.STEPS) {
			let strategyToUse = strategy.fallback
			for (const step of this.sortedInnerSteps) {
				if (pauseDurationMillis <= step.maxSleepTime) {
					strategyToUse = step.strategy
					break
				}
			}

			const innerEntity = new SeekBackStrategyEntity(strategyToUse)
			return innerEntity.computeJumpBackTime(pauseDurationMillis)
		} else {
			throw new Error("Unreachable code")
		}
	}

	computeJumpBackTime = (pauseDurationMillis: number): number => {
		const res = this.innerComputeJumpBackTime(pauseDurationMillis)
		if (!isFinite(res) || res < 0) return 0 // sanity check

		return res
	}

	computeTimestampBasedJumpBackTime = (
		lastPlayedTimestamp: TimestampMs,
		now: TimestampMs = getNowTimestamp()
	): number => {
		return this.computeJumpBackTime(Math.max(0, now - lastPlayedTimestamp))
	}
}

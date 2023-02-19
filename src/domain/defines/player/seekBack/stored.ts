
export enum StoredSeekBackStrategyType {
	NONE = 0,
	LINEAR = 1,
	STEPS = 2,
	CONSTANT = 3,
}

export type StoredSeekBackStrategy =
	| {
			type: StoredSeekBackStrategyType.NONE
	  }
	| {
			type: StoredSeekBackStrategyType.LINEAR
			coefficient: number
			limit: number
	  }
	| {
			type: StoredSeekBackStrategyType.CONSTANT
			value: number
	  }
	| {
			type: StoredSeekBackStrategyType.STEPS
			steps: {
				maxSleepTime: number
				strategy: StoredSeekBackStrategy
			}[]
			fallback: StoredSeekBackStrategy
	  }

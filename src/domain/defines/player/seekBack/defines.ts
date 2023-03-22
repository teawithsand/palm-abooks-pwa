export enum SeekBackStrategyDataType {
	NONE = 0,
	LINEAR = 1,
	STEPS = 2,
	CONSTANT = 3,
}

export type SeekBackStrategyData =
	| {
			type: SeekBackStrategyDataType.NONE
	  }
	| {
			type: SeekBackStrategyDataType.LINEAR
			coefficient: number
			limit: number
	  }
	| {
			type: SeekBackStrategyDataType.CONSTANT
			value: number
	  }
	| {
			type: SeekBackStrategyDataType.STEPS
			steps: {
				maxSleepTime: number
				strategy: SeekBackStrategyData
			}[]
			fallback: SeekBackStrategyData
	  }

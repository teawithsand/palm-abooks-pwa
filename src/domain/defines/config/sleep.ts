import { Serializer } from "@app/util/transform"

export const DEFAULT_SLEEP_CONFIG: SleepConfig =  {
	baseDuration: 30 * 60 * 1000 - 10 * 1000,
	shakeResetsSleep: false,
	turnVolumeDownDuration: 10 * 1000,
	turnVolumeDownEndLevel: 0,
	turnVolumeDownStartLevel: 1,
}

export type SleepConfig = {
	baseDuration: number

	turnVolumeDownDuration: number // ignored when not duration number or zero
	turnVolumeDownStartLevel: number
	turnVolumeDownEndLevel: number

	shakeResetsSleep: boolean
}

export type StoredSleepConfig = SleepConfig

export const SleepConfigSerializer: Serializer<SleepConfig, StoredSleepConfig> =
	{
		serialize: (input) => input,
		deserialize: (input) => input,
	}

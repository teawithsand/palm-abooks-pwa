import { Serializer } from "@app/util/transform"

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

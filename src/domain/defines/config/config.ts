import { SleepConfig } from "@app/domain/managers/sleep/sleepManager"

export type GlobalPlayerConfig = {
	speed: number
	sleepConfig: SleepConfig
	preservePitchForSpeed: boolean
}

export const INIT_GLOBAL_PLAYER_CONFIG: GlobalPlayerConfig = {
	speed: 1,
	preservePitchForSpeed: false,
	sleepConfig: {
		baseDuration: 30 * 60 * 1000,
		shakeResetsSleep: false,
		turnVolumeDownDuration: 10 * 1000,
		turnVolumeDownEndLevel: 0,
		turnVolumeDownStartLevel: 1,
	},
}

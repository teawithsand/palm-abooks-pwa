import {
	PlayerSeekAction,
	PlayerSeekActionType,
} from "@app/domain/defines/player/action"
import { SleepConfig } from "@app/domain/managers/sleep/sleepManager"

export type GlobalPlayerConfig = {
	speed: number
	sleepConfig: SleepConfig
	preservePitchForSpeed: boolean
	isSleepEnabled: boolean

	mediaSessionSeekAction: PlayerSeekAction
	shortButtonSeekAction: PlayerSeekAction
	longButtonSeekAction: PlayerSeekAction
}

export const INIT_GLOBAL_PLAYER_CONFIG: GlobalPlayerConfig = {
	speed: 1,
	preservePitchForSpeed: false,

	isSleepEnabled: false,
	sleepConfig: {
		baseDuration: 30 * 60 * 1000,
		shakeResetsSleep: false,
		turnVolumeDownDuration: 10 * 1000,
		turnVolumeDownEndLevel: 0,
		turnVolumeDownStartLevel: 1,
	},

	mediaSessionSeekAction: {
		type: PlayerSeekActionType.SEEK_RELATIVE,
		offsetMillis: 10 * 1000,
	},
	
	shortButtonSeekAction: {
		type: PlayerSeekActionType.SEEK_RELATIVE,
		offsetMillis: 10 * 1000,
	},

	longButtonSeekAction: {
		type: PlayerSeekActionType.SEEK_RELATIVE,
		offsetMillis: 60 * 1000,
	},
}

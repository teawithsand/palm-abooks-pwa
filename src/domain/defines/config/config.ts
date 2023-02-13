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

	lastFileTransferName: string

	seekActions: {
		mediaSession: PlayerSeekAction
		short: PlayerSeekAction
		long: PlayerSeekAction
	}
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

	lastFileTransferName: "",

	seekActions: {
		mediaSession: {
			type: PlayerSeekActionType.SEEK_RELATIVE,
			offsetMillis: 10 * 1000,
		},

		short: {
			type: PlayerSeekActionType.SEEK_RELATIVE,
			offsetMillis: 10 * 1000,
		},

		long: {
			type: PlayerSeekActionType.SEEK_RELATIVE,
			offsetMillis: 60 * 1000,
		},
	},
}

import {
	SleepConfig,
	SleepConfigSerializer,
	StoredSleepConfig,
} from "@app/domain/defines/config/sleep"
import {
	PlayerSeekAction,
	PlayerSeekActionSerializer,
	PlayerSeekActionType,
	StoredPlayerSeekAction,
} from "@app/domain/defines/player/action"
import { SeekBackStrategyDataType } from "@app/domain/defines/player/seekBack/defines"
import { StoredSeekBackStrategy } from "@app/domain/defines/player/seekBack/stored"
import { SeekBackStrategyEntity } from "@app/domain/defines/player/seekBack/strategy"
import { VersioningSerializer } from "@teawithsand/tws-config"

export type StoredGlobalPlayerConfig = {
	version: 0

	speed: number
	sleepConfig: StoredSleepConfig | null
	preservePitchForSpeed: boolean
	isSleepEnabled: boolean

	lastFileTransferName: string

	seekBackStrategy: StoredSeekBackStrategy

	seekActions: {
		mediaSession: StoredPlayerSeekAction
		short: StoredPlayerSeekAction
		long: StoredPlayerSeekAction
	}
}

export type GlobalPlayerConfig = {
	speed: number
	sleepConfig: SleepConfig | null
	preservePitchForSpeed: boolean
	isSleepEnabled: boolean

	lastFileTransferName: string

	seekBackStrategy: SeekBackStrategyEntity

	seekActions: {
		mediaSession: PlayerSeekAction
		short: PlayerSeekAction
		long: PlayerSeekAction
	}
}

export const INIT_GLOBAL_PLAYER_CONFIG: GlobalPlayerConfig = {
	speed: 1,
	preservePitchForSpeed: false,

	seekBackStrategy: new SeekBackStrategyEntity({
		type: SeekBackStrategyDataType.LINEAR,
		coefficient: 1 / 3,
		limit: 60 * 1000,
	}),
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

export const GlobalPlayerConfigSerializer = new VersioningSerializer<
	GlobalPlayerConfig,
	StoredGlobalPlayerConfig
>(
	(value) => ({
		version: 0,

		speed: value.speed,
		sleepConfig: value.sleepConfig
			? SleepConfigSerializer.serialize(value.sleepConfig)
			: null,
		preservePitchForSpeed: value.preservePitchForSpeed,
		isSleepEnabled: value.isSleepEnabled,

		lastFileTransferName: value.lastFileTransferName,

		seekBackStrategy: value.seekBackStrategy.serialize(),

		seekActions: {
			mediaSession: PlayerSeekActionSerializer.serialize(
				value.seekActions.mediaSession
			),
			short: PlayerSeekActionSerializer.serialize(
				value.seekActions.short
			),
			long: PlayerSeekActionSerializer.serialize(value.seekActions.long),
		},
	}),
	{
		0: (value) => ({
			speed: value.speed,
			sleepConfig: value.sleepConfig
				? SleepConfigSerializer.deserialize(value.sleepConfig)
				: null,
			preservePitchForSpeed: value.preservePitchForSpeed,
			isSleepEnabled: value.isSleepEnabled,
			lastFileTransferName: value.lastFileTransferName,
			seekBackStrategy: SeekBackStrategyEntity.Serializer.deserialize(
				value.seekBackStrategy
			),
			seekActions: {
				mediaSession: PlayerSeekActionSerializer.deserialize(
					value.seekActions.mediaSession
				),
				short: PlayerSeekActionSerializer.deserialize(
					value.seekActions.short
				),
				long: PlayerSeekActionSerializer.deserialize(
					value.seekActions.long
				),
			},
		}),
	},
	0
)

import { ConfigManager } from "@app/domain/managers/config"
import { PlayerManager } from "@app/domain/managers/player/playerManager"
import { Timestamps, getTimestamps } from "@app/util/timestamps"
import {
	SleepEventType,
	SleepHelper,
	isTimeNumber,
} from "@teawithsand/tws-player"
import {
	DefaultStickyEventBus,
	StickyEventBus,
	StickySubscribable,
	getNowPerformanceTimestamp,
} from "@teawithsand/tws-stl"
import produce from "immer"

export type SleepConfig = {
	baseDuration: number

	turnVolumeDownDuration: number // ignored when not duration number or zero
	turnVolumeDownStartLevel: number
	turnVolumeDownEndLevel: number

	shakeResetsSleep: boolean
}

export enum SleepManagerStateType {
	DISABLED = 1,
	ENABLED = 2,
	ENABLED_BUT_STOPPED = 3,
}

export type SleepManagerState =
	| {
			type: SleepManagerStateType.DISABLED
	  }
	| {
			type: SleepManagerStateType.ENABLED
			config: SleepConfig
			startedTimestamps: Timestamps
	  }
	| {
			type: SleepManagerStateType.ENABLED_BUT_STOPPED
			config: SleepConfig
	  }

export class SleepManager {
	private readonly sleepHelper = new SleepHelper()

	private readonly configBus: StickyEventBus<SleepConfig | null> =
		new DefaultStickyEventBus(null)

	private readonly innerPlayerStateBus: StickyEventBus<SleepManagerState> =
		new DefaultStickyEventBus({
			type: SleepManagerStateType.DISABLED,
		})

	public get bus(): StickySubscribable<SleepManagerState> {
		return this.innerPlayerStateBus
	}

	setSleep = (sleepConfig: SleepConfig | null) => {
		this.configBus.emitEvent(sleepConfig)
	}

	setSleepConfigFromStoredConfig = () => {
		this.setSleep(
			this.configManager.globalPlayerConfig.getOrThrow().sleepConfig
		)
	}

	constructor(
		playerManager: PlayerManager,
		private readonly configManager: ConfigManager
	) {
		let currentSleepConfig: SleepConfig | null = null
		let lastIsPlayingWhenReady =
			playerManager.playerStateBus.lastEvent.innerState.config
				.isPlayingWhenReady

		const syncConfigToHelper = (
			config: SleepConfig | null,
			isPlaying: boolean
		) => {
			if (config) {
				// if player config was updated for different reason, we do not want to handle it

				if (isPlaying) {
					this.innerPlayerStateBus.emitEvent({
						type: SleepManagerStateType.ENABLED,
						config,
						startedTimestamps: getTimestamps(),
					})
				} else {
					this.innerPlayerStateBus.emitEvent({
						type: SleepManagerStateType.ENABLED_BUT_STOPPED,
						config,
					})
				}
			} else {
				this.innerPlayerStateBus.emitEvent({
					type: SleepManagerStateType.DISABLED,
				})
			}
		}

		this.configBus.addSubscriber((config) => {
			currentSleepConfig = config

			// always perform sync config if manually updated by external user
			syncConfigToHelper(
				config,
				playerManager.playerStateBus.lastEvent.innerState.config
					.isPlayingWhenReady
			)

			// HACK(teawithsand): config should be already loaded, but this will work as well
			if (configManager.globalPlayerConfig.loaded) {
				configManager.globalPlayerConfig.update((draft) => {
					if (config) {
						draft.sleepConfig = config
					}
					draft.isSleepEnabled = config !== null
				})
			}
		})

		playerManager.playerStateBus.addSubscriber((state) => {
			const isPlaying = state.innerState.config.isPlayingWhenReady
			if (isPlaying !== lastIsPlayingWhenReady) {
				lastIsPlayingWhenReady = isPlaying

				// sync config only when isPlaying changes. We do not want non-is-playing changes to reset our sleep countdown.
				syncConfigToHelper(currentSleepConfig, isPlaying)
			}
		})

		this.innerPlayerStateBus.addSubscriber((state) => {
			if (state.type === SleepManagerStateType.ENABLED) {
				const { config } = state
				this.sleepHelper.setSleep({
					mainDurationMillis: config.baseDuration,
					volumeDownDurationMillis:
						isTimeNumber(config.turnVolumeDownDuration) &&
						config.turnVolumeDownDuration > 0
							? config.turnVolumeDownDuration
							: undefined,
				})
			} else {
				this.sleepHelper.setSleep(null)
			}
		})

		this.sleepHelper.sleepEventBus.addSubscriber((event) => {
			if (!currentSleepConfig) return // may have happened, shouldn't though

			if (event.type === SleepEventType.SLEEP_VOLUME_TURN_PROGRESS) {
				const timeFractionPassed =
					event.volumeDownProgressMillis /
					event.volumeDownDurationMillis
				// const timeFractionLeft = 1 - timeFractionPassed

				const startVolume = Math.min(
					1,
					currentSleepConfig.turnVolumeDownStartLevel
				)
				const endVolume = Math.min(
					startVolume,
					currentSleepConfig.turnVolumeDownEndLevel
				)

				const delta = startVolume - endVolume

				const volume = startVolume - timeFractionPassed * delta

				// for now we exclusively own volume here, in other cases it may be delegated to somewhere else
				playerManager.mutateConfig((draft) => (draft.volume = volume))
			} else if (
				event.type === SleepEventType.SLEEP_CANCEL ||
				event.type === SleepEventType.SLEEP_FINISHED
			) {
				playerManager.mutateConfig((draft) => (draft.volume = 1))
			}

			if (event.type === SleepEventType.SLEEP_FINISHED) {
				// once this has happened, one should ALWAYS go to ENABLED_BUT_STOPPED state
				// but right now pausing guarantees it so we're fine.
				playerManager.mutateConfig(
					(draft) => (draft.isPlayingWhenReady = false)
				)
			}
		})
	}
}

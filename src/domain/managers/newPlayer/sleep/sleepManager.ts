import { SleepConfig } from "@app/domain/defines/config/sleep"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import { ShakeManager } from "@app/domain/managers/shakeManager"
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
} from "@teawithsand/tws-stl"

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

	private readonly innerBus: StickyEventBus<SleepManagerState> =
		new DefaultStickyEventBus({
			type: SleepManagerStateType.DISABLED,
		})

	public get bus(): StickySubscribable<SleepManagerState> {
		return this.innerBus
	}

	setSleep = (sleepConfig: SleepConfig | null) => {
		this.configBus.emitEvent(sleepConfig)
	}

	constructor(playerManager: NewPlayerManager, shakeManager: ShakeManager) {
		let currentSleepConfig: SleepConfig | null = null
		let lastIsPlayingWhenReady =
			playerManager.bus.lastEvent.playerState.config.isPlayingWhenReady

		shakeManager.shakeBus.addSubscriber(() => {
			const lastEvent = this.innerBus.lastEvent
			if (
				lastEvent.type === SleepManagerStateType.ENABLED &&
				lastEvent.config.shakeResetsSleep
			) {
				this.setSleep(lastEvent.config)
			}
		})

		const syncConfigToHelper = (
			config: SleepConfig | null,
			isPlaying: boolean
		) => {
			if (config) {
				// if player config was updated for different reason, we do not want to handle it

				if (isPlaying) {
					this.innerBus.emitEvent({
						type: SleepManagerStateType.ENABLED,
						config,
						startedTimestamps: getTimestamps(),
					})
				} else {
					this.innerBus.emitEvent({
						type: SleepManagerStateType.ENABLED_BUT_STOPPED,
						config,
					})
				}
			} else {
				this.innerBus.emitEvent({
					type: SleepManagerStateType.DISABLED,
				})
			}
		}

		this.configBus.addSubscriber((config) => {
			currentSleepConfig = config

			// always perform sync config if manually updated by external user
			syncConfigToHelper(
				config,
				playerManager.bus.lastEvent.playerState.config
					.isPlayingWhenReady
			)
		})

		playerManager.bus.addSubscriber((state) => {
			const isPlaying = state.playerState.config.isPlayingWhenReady
			if (isPlaying !== lastIsPlayingWhenReady) {
				lastIsPlayingWhenReady = isPlaying

				// sync config only when isPlaying changes. We do not want non-is-playing changes to reset our sleep countdown.
				syncConfigToHelper(currentSleepConfig, isPlaying)
			}
		})

		this.innerBus.addSubscriber((state) => {
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
				playerManager.mutatePlayerConfig(
					(draft) => (draft.volume = volume)
				)
			}

			if (
				event.type === SleepEventType.SLEEP_CANCEL ||
				event.type === SleepEventType.SLEEP_FINISHED
			) {
				playerManager.mutatePlayerConfig((draft) => (draft.volume = 1))
			}

			if (event.type === SleepEventType.SLEEP_FINISHED) {
				// once this has happened, one should ALWAYS go to ENABLED_BUT_STOPPED state
				// but right now pausing guarantees it so we're fine.
				playerManager.mutatePlayerConfig(
					(draft) => (draft.isPlayingWhenReady = false)
				)
			}
		})
	}
}

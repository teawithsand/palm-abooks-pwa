import { SleepConfig } from "@app/domain/defines/config/sleep"
import { AbookEntity } from "@app/domain/defines/entity/abook"
import {
	PlayerSeekAction,
	PlayerSeekActionType,
} from "@app/domain/defines/player/action"
import {
	SeekData,
	SeekDiscardCondition,
	SeekType,
} from "@app/domain/defines/seek"
import { ConfigManager } from "@app/domain/managers/config/config"
import { DefaultPlayerEntryList } from "@app/domain/managers/newPlayer/list/entryList"
import {
	PlayerEntryListMetadata,
	PlayerEntryListMetadataType,
} from "@app/domain/managers/newPlayer/list/metadata"
import { PlayerEntryListManager } from "@app/domain/managers/newPlayer/list/playerEntryListManager"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import { SeekBackManager } from "@app/domain/managers/newPlayer/seekBack/seekBackManager"
import {
	SleepManager,
	SleepManagerStateType,
} from "@app/domain/managers/newPlayer/sleep/sleepManager"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { FileEntryEntityPlayerSource } from "@app/domain/managers/newPlayer/source/source"
import { AbookDb } from "@app/domain/storage/db"
import { StaticPlayerSource, isTimeNumber } from "@teawithsand/tws-player"
import {
	MediaSessionApiHelper,
	MediaSessionEventType,
	PerformanceTimestampMs,
	generateUUID,
	getNowPerformanceTimestamp,
} from "@teawithsand/tws-stl"

export class PlayerActionManager {
	constructor(
		private readonly abookDb: AbookDb,
		private readonly playerManager: NewPlayerManager,
		private readonly configManager: ConfigManager,
		private readonly entryListManager: PlayerEntryListManager,
		private readonly sleepManager: SleepManager,
		private readonly seekBackManager: SeekBackManager
	) {
		this.initMediaSession()
	}

	private mediaSessionManager = MediaSessionApiHelper.instance
	private initMediaSession = () => {
		this.mediaSessionManager.setSupportedActions([
			"play",
			"pause",
			"nexttrack",
			"previoustrack",
		])
		this.mediaSessionManager.eventBus.addSubscriber((event) => {
			if (event.type === MediaSessionEventType.PAUSE) {
				this.setIsPlaying(false)
			} else if (event.type === MediaSessionEventType.PLAY) {
				this.setIsPlaying(true)
			} else if (event.type === MediaSessionEventType.PREVIOUS_TRACK) {
				const config =
					this.configManager.globalPlayerConfig.configBus.lastEvent
				if (!config) return
				this.executeSeekAction(config.seekActions.mediaSession, true)
			} else if (event.type === MediaSessionEventType.NEXT_TRACK) {
				const config =
					this.configManager.globalPlayerConfig.configBus.lastEvent
				if (!config) return

				this.executeSeekAction(config.seekActions.mediaSession, false)
			}

			// TODO(teawithsand): here support for the rest of events
		})
	}

	public seek = (seekData: SeekData) => {
		if (this.playerManager.seekQueue.queueLength > 10) return // silently ignore call in that case

		this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			discardCond: SeekDiscardCondition.NO_METADATA,
			seekData: seekData,
			deadlinePerfTimestamp: (getNowPerformanceTimestamp() +
				100) as PerformanceTimestampMs,
		})
	}

	public executeSeekAction = (
		seekAction: PlayerSeekAction,
		backwards: boolean
	) => {
		if (seekAction.type === PlayerSeekActionType.JUMP_FILE) {
			if (backwards) {
				this.prevFile()
			} else {
				this.nextFile()
			}
		} else if (seekAction.type === PlayerSeekActionType.SEEK_RELATIVE) {
			this.globalRelativeSeek(
				seekAction.offsetMillis * (backwards ? -1 : 1)
			)
		}
	}

	public localSeek = (posMillis: number) => {
		if (!isTimeNumber(posMillis)) return

		this.seek({
			type: SeekType.ABSOLUTE_IN_FILE,
			positionMs: posMillis,
		})
	}

	public localRelativeSeek = (deltaMillis: number) => {
		if (!isTimeNumber(Math.abs(deltaMillis))) return

		this.seek({
			type: SeekType.RELATIVE_IN_FILE,
			positionDeltaMs: deltaMillis,
		})
	}

	public globalSeek = (posMillis: number) => {
		if (!isTimeNumber(posMillis)) return

		this.seek({
			type: SeekType.ABSOLUTE_GLOBAL,
			positionMs: posMillis,
		})
	}

	public globalRelativeSeek = (deltaMillis: number) => {
		if (!isTimeNumber(Math.abs(deltaMillis))) return

		this.seek({
			type: SeekType.RELATIVE_GLOBAL,
			positionDeltaMs: deltaMillis,
		})
	}

	public jump = (entryId: string, posMillis = 0) => {
		this.seek({
			type: SeekType.ABSOLUTE_TO_FILE,
			playerEntryId: entryId,
			positionMs: posMillis,
		})
	}

	public nextFile = () => {
		this.entryListManager.goToNext()
	}

	public jumpForward = () => {
		this.localRelativeSeek(10 * 1000)
	}

	public jumpBackward = () => {
		this.localRelativeSeek(-10 * 1000)
	}

	public shortForwardButtonAction = () => {
		const config = this.configManager.globalPlayerConfig.configBus.lastEvent
		if (!config) return
		this.executeSeekAction(config.seekActions.short, false)
	}

	public longForwardButtonAction = () => {
		const config = this.configManager.globalPlayerConfig.configBus.lastEvent
		if (!config) return

		this.executeSeekAction(config.seekActions.long, false)
	}

	public shortBackwardButtonAction = () => {
		const config = this.configManager.globalPlayerConfig.configBus.lastEvent
		if (!config) return

		this.executeSeekAction(config.seekActions.short, true)
	}

	public longBackwardButtonAction = () => {
		const config = this.configManager.globalPlayerConfig.configBus.lastEvent
		if (!config) return

		this.executeSeekAction(config.seekActions.long, true)
	}

	public prevFile = () => {
		this.entryListManager.goToPrev()
	}

	public togglePlay = (jumpBack = true) => {
		this.setIsPlaying(
			!this.playerManager.bus.lastEvent.playerState.config
				.isPlayingWhenReady,
			jumpBack
		)
	}

	public setIsPlaying = (isPlaying: boolean, jumpBack = true) => {
		if (isPlaying) {
			// HACK(teawithsand): there is a risk that in between executing seek and setting play
			// somebody will trigger another seeking, which would double, or in general multiple PMAP effect
			//
			// This is now handled by hack in PMAPManager, which resets timer when enqueueJumpBackAfterSeek occurs.

			const play = () => {
				this.playerManager.mutatePlayerConfig((draft) => {
					draft.isPlayingWhenReady = true
				})
			}

			if (jumpBack) {
				const res = this.seekBackManager.onBeforeToggledToPlay()

				if (!res) {
					play()
				} else {
					// TODO(teawithsand): skip call to play if PMAP seeking was started already
					res.addSubscriber((ev, unsubscribe) => {
						if (!ev) return
						unsubscribe()

						play()
					})
				}
			} else {
				play()
			}
		} else {
			this.playerManager.mutatePlayerConfig((draft) => {
				draft.isPlayingWhenReady = false
			})
		}
	}

	public setSpeed = (speed: number) => {
		if (!isFinite(speed) || speed <= 0 || speed >= 10) return

		this.configManager.globalPlayerConfig.updateConfig((draft) => {
			draft.speed = speed
		})
		this.configManager.globalPlayerConfig.save()
	}

	public setPreservePitchForSpeed = (preserve: boolean) => {
		this.configManager.globalPlayerConfig.updateConfig((draft) => {
			draft.preservePitchForSpeed = preserve
		})
		this.configManager.globalPlayerConfig.save()
	}

	public setSleepFromConfig = () => {
		const config = this.configManager.globalPlayerConfig.configBus.lastEvent
		if (!config) return

		if (config.isSleepEnabled) {
			this.sleepManager.setSleep(config.sleepConfig)
		} else {
			this.sleepManager.setSleep(null)
		}
	}

	public setSleepConfigManual = (sleepConfig: SleepConfig | null) => {
		if (sleepConfig) {
			this.configManager.globalPlayerConfig.updateConfig((draft) => {
				draft.sleepConfig = sleepConfig
			})
			this.configManager.globalPlayerConfig.save()
		}
		this.sleepManager.setSleep(sleepConfig)
	}

	/**
	 * @deprecated Just set sleep config manual to null.
	 */
	public unsetSleep = () => {
		this.setSleepConfigManual(null)
	}

	public resetSleep = () => {
		const lastEvent = this.sleepManager.bus.lastEvent
		if (lastEvent.type === SleepManagerStateType.ENABLED) {
			this.sleepManager.setSleep(lastEvent.config)
		}
	}

	public unsetPlaylist = () => {
		this.entryListManager.setList(
			new DefaultPlayerEntryList(),
			null,
			new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.UNKNOWN,
			})
		)
	}

	public playLocalFiles = (files: File[]) => {
		const list = new DefaultPlayerEntryList()
		const entries = files.map(
			(f) => new PlayerEntry(new StaticPlayerSource(f))
		)
		list.setEntries(entries)
		this.entryListManager.setList(
			list,
			entries.length ? entries[0].id : null,
			new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.LOCAL_FILES,
			})
		)
	}

	public playAbook = (abook: AbookEntity) => {
		const list = new DefaultPlayerEntryList()
		const entries = abook.entries.map(
			(v) =>
				new PlayerEntry(
					new FileEntryEntityPlayerSource(this.abookDb, v)
				)
		)
		list.setEntries(entries)
		this.entryListManager.setList(
			list,
			entries.length ? entries[0].id : null,
			new PlayerEntryListMetadata({
				type: PlayerEntryListMetadataType.ABOOK,
				abook,
			})
		)
	}
}

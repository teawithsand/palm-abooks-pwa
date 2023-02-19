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
import { ConfigManager } from "@app/domain/managers/config"
import { DefaultPlayerEntryList } from "@app/domain/managers/newPlayer/list/entryList"
import {
	PlayerEntryListMetadata,
	PlayerEntryListMetadataType,
} from "@app/domain/managers/newPlayer/list/metadata"
import { PlayerEntryListManager } from "@app/domain/managers/newPlayer/list/playerEntryListManager"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import {
	SleepConfig,
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
	generateUUID,
} from "@teawithsand/tws-stl"

// TODO(teawithsand): hook jump back after pause manager to this class' play/pause method.
// TODO(teawithsand): hook this manager everywhere player's needed

// TODO(teawithsand): put position loading somewhere, so that player UI is disabled BEFORE position load happens

// TODO(teawithsand): implement seek data here

export class PlayerActionManager {
	constructor(
		private readonly abookDb: AbookDb,
		private readonly playerManager: NewPlayerManager,
		private readonly configManager: ConfigManager,
		private readonly entryListManager: PlayerEntryListManager,
		private readonly sleepManager: SleepManager
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
				this.executeSeekAction(
					this.configManager.globalPlayerConfig.getOrThrow()
						.seekActions.mediaSession,
					true
				)
			} else if (event.type === MediaSessionEventType.NEXT_TRACK) {
				this.executeSeekAction(
					this.configManager.globalPlayerConfig.getOrThrow()
						.seekActions.mediaSession,
					false
				)
			}

			// TODO(teawithsand): here support for the rest of events
		})
	}

	public seek = (seekData: SeekData) => {
		if (seekData.type === SeekType.ABSOLUTE_IN_FILE) {
			this.localSeek(seekData.positionMs)
		} else if (seekData.type === SeekType.ABSOLUTE_TO_FILE) {
			this.jump(seekData.playerEntryId, seekData.positionMs)
		} else if (seekData.type === SeekType.RELATIVE_GLOBAL) {
			this.globalRelativeSeek(seekData.positionDeltaMs)
		} else if (seekData.type === SeekType.RELATIVE_IN_FILE) {
			this.localRelativeSeek(seekData.positionDeltaMs)
		} else if (seekData.type === SeekType.ABSOLUTE_GLOBAL) {
			this.globalSeek(seekData.positionMs)
		}
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

		this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			discardCond: SeekDiscardCondition.INSTANT,
			seekData: {
				type: SeekType.ABSOLUTE_IN_FILE,
				positionMs: posMillis,
			},
			deadlinePerfTimestamp: null,
		})
	}

	public localRelativeSeek = (deltaMillis: number) => {
		if (!isTimeNumber(Math.abs(deltaMillis))) return

		this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			discardCond: SeekDiscardCondition.INSTANT,
			seekData: {
				type: SeekType.RELATIVE_IN_FILE,
				positionDeltaMs: deltaMillis,
			},
			deadlinePerfTimestamp: null,
		})
	}

	public globalSeek = (posMillis: number) => {
		if (!isTimeNumber(posMillis)) return

		this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			discardCond: SeekDiscardCondition.INSTANT,
			seekData: {
				type: SeekType.ABSOLUTE_GLOBAL,
				positionMs: posMillis,
			},
			deadlinePerfTimestamp: null,
		})
	}

	public globalRelativeSeek = (deltaMillis: number) => {
		if (!isTimeNumber(Math.abs(deltaMillis))) return

		this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			discardCond: SeekDiscardCondition.INSTANT,
			seekData: {
				type: SeekType.RELATIVE_GLOBAL,
				positionDeltaMs: deltaMillis,
			},
			deadlinePerfTimestamp: null,
		})
	}

	public jump = (entryId: string, posMillis = 0) => {
		this.playerManager.seekQueue.enqueueSeek({
			id: generateUUID(),
			discardCond: SeekDiscardCondition.INSTANT,
			seekData: {
				type: SeekType.ABSOLUTE_TO_FILE,
				playerEntryId: entryId,
				positionMs: posMillis,
			},
			deadlinePerfTimestamp: null,
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
		this.executeSeekAction(
			this.configManager.globalPlayerConfig.getOrThrow().seekActions
				.short,
			false
		)
	}

	public longForwardButtonAction = () => {
		this.executeSeekAction(
			this.configManager.globalPlayerConfig.getOrThrow().seekActions.long,
			false
		)
	}

	public shortBackwardButtonAction = () => {
		this.executeSeekAction(
			this.configManager.globalPlayerConfig.getOrThrow().seekActions
				.short,
			true
		)
	}

	public longBackwardButtonAction = () => {
		this.executeSeekAction(
			this.configManager.globalPlayerConfig.getOrThrow().seekActions.long,
			true
		)
	}

	public prevFile = () => {
		this.entryListManager.goToPrev()
	}

	public togglePlay = () => {
		this.setIsPlaying(
			!this.playerManager.bus.lastEvent.playerState.config
				.isPlayingWhenReady
		)
	}

	public setIsPlaying = (isPlaying: boolean) => {
		if (isPlaying) {
			/*
			// HACK(teawithsand): there is a risk that in between executing seek and setting play
			// somebody will trigger another seeking, which would double, or in general multiple PMAP effect
			//
			// This is now handled by hack in PMAPManager, which resets timer when enqueueJumpBackAfterSeek occurs.
			const res = this.positionMoveAfterPauseManager.enqueueJumpBackSeek()

			const play = () => {
				this.playerManager.mutateConfig((draft) => {
					draft.isPlayingWhenReady = true
				})
			}

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
			*/
			this.playerManager.mutatePlayerConfig((draft) => {
				draft.isPlayingWhenReady = true
			})
		} else {
			this.playerManager.mutatePlayerConfig((draft) => {
				draft.isPlayingWhenReady = false
			})
		}
	}

	public setSpeed = (speed: number) => {
		if (!isFinite(speed) || speed <= 0 || speed >= 10) return

		this.playerManager.mutatePlayerConfig((draft) => {
			draft.speed = speed
		})
		this.configManager.globalPlayerConfig.update((draft) => {
			draft.speed = speed
		})
	}

	public setPreservePitchForSpeed = (preserve: boolean) => {
		this.playerManager.mutatePlayerConfig((draft) => {
			draft.preservePitchForSpeed = preserve
		})
		this.configManager.globalPlayerConfig.update((draft) => {
			draft.preservePitchForSpeed = preserve
		})
	}

	public setSleepFromConfig = () => {
		this.sleepManager.setSleepConfigFromStoredConfig()
	}

	public setSleepConfigManual = (sleepData: SleepConfig | null) => {
		this.sleepManager.setSleep(sleepData)
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

import { PlayableEntryPlaybackInfo } from "@app/domain/defines/info/entry"

export enum PlaybackInfoType {
	NONE = 0,
	COMMON = 1,
}

type CommonPlaybackInfo = {
	speed: number
	isPlaying: boolean

	entryInfo: PlayableEntryPlaybackInfo
}

export type PlaybackInfo =
	| { type: PlaybackInfoType.NONE }
	| ({
			type: PlaybackInfoType.COMMON
	  } & CommonPlaybackInfo)

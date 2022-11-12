import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { WhatToPlayData } from "@app/domain/managers/whatToPlayManager"
import { MetadataBag } from "@teawithsand/tws-player"

export type ControlsPlayerDisplayData = {
	whatToPlayData: WhatToPlayData
	entry: PlayableEntry

	isPlaying: boolean
	position: number | null
	duration: number | null

	metadataBag: MetadataBag
}

export type ControlsPlayerDisplayCallbacks = {
	togglePlay?: (toIsPlaying: boolean) => void
	localSeekTo?: (position: number) => void
}

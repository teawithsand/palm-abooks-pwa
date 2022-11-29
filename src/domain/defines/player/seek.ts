import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { MetadataBag } from "@teawithsand/tws-player"

export type AbsoluteSeekResolutionData = {
	entriesBag: PlayableEntriesBag
	metadataBag: MetadataBag
}

export type RelativeSeekResolutionData = {
	currentSourceKey: string | null
	currentPosition: number | null
} & AbsoluteSeekResolutionData

export type SeekResolutionResult = {
	sourceKey: string
	sourcePosition: number
}

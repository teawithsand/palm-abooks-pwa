import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { useAppManager } from "@app/domain/managers/app"
import { PlayerManagerState } from "@app/domain/managers/playerManager"
import { WhatToPlayData } from "@app/domain/managers/whatToPlayManager"
import { useValidValue } from "@app/util/useBoolMemo"
import {
	MetadataBag,
	MetadataLoadingResultType,
	PlayerSourceProvider,
} from "@teawithsand/tws-player"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import { useMemo, useRef } from "react"

export type UiPlayerPositionData = {
	currentEntryIndex: number | null
	currentEntryId: string | null

	currentEntryDuration: number | null
	currentEntryPosition: number | null
	currentGlobalPosition: number | null
	currentGlobalDuration: number | null

	nextSourceId: string | null
	/**
	 * Prev according to source provider, not what user has been playing before picking their next song.
	 */
	prevSourceId: string | null
}

export type UiPlayerData = {
	metadataBag: MetadataBag
	/**
	 * Note: order of these is determined by source rather than this array.
	 *
	 * TODO(teawithsand): consider removing it in favour of sources
	 */
	entries: PlayableEntry[]
	currentPosition: UiPlayerPositionData
	lastValidPosition: UiPlayerPositionData
	isPositionCorrupted: boolean

	isPlaying: boolean
	isSeeking: boolean

	sourceProvider: PlayerSourceProvider<PlayableEntry, string>

	whatToPlayData: WhatToPlayData
	playerManagerState: PlayerManagerState
}

export const useUiPlayerData = (): UiPlayerData | null => {
	const app = useAppManager()
	const playerManagerState = useStickySubscribable(
		app.playerManager.playerStateBus
	)
	const whatToPlayData = useStickySubscribable(app.whatToPlayManager.bus)

	const lastValidPositionRef = useRef<UiPlayerPositionData | null>(null)

	if (!whatToPlayData || whatToPlayData.entriesBag.length === 0) return null

	const provider = playerManagerState.innerState.config.sourceProvider
	const currentEntryId = playerManagerState.innerState.config.sourceKey
	const currentEntryIndex = useMemo(
		() =>
			currentEntryId !== null
				? whatToPlayData.entries.findIndex(
						(e) => e.id === currentEntryId
				  )
				: null,
		[currentEntryId, whatToPlayData.entries]
	)

	const nextSourceId = useMemo(
		() => provider.getNextSourceKey(currentEntryId),
		[provider, currentEntryId]
	)

	const prevSourceId = useMemo(
		() => provider.getPrevSourceKey(currentEntryId),
		[provider, currentEntryId]
	)

	if (currentEntryIndex === null || currentEntryIndex < 0) return null

	const currentMetadataEntry = (() => {
		const r = whatToPlayData.metadata.getResult(currentEntryIndex)
		if (!r || r.type !== MetadataLoadingResultType.OK) return null

		return r.metadata
	})()

	const globalPositionUpToCurrentEntry = useMemo(() => {
		return whatToPlayData.metadata.getDurationToIndex(currentEntryIndex)
	}, [whatToPlayData.metadata, currentEntryIndex])

	const currentGlobalDuration = useMemo(() => {
		if (whatToPlayData.metadata.length === 0) return 0
		return whatToPlayData.metadata.getDurationToIndex(
			whatToPlayData.metadata.length - 1,
			true
		)
	}, [whatToPlayData.metadata])

	const currentPosition: UiPlayerPositionData = {
		currentEntryId,
		currentEntryIndex,
		nextSourceId,
		prevSourceId,

		currentEntryDuration:
			playerManagerState.innerState.duration ??
			currentMetadataEntry?.duration ??
			null,
		currentEntryPosition: playerManagerState.innerState.position,
		currentGlobalPosition:
			globalPositionUpToCurrentEntry !== null &&
			playerManagerState.innerState.position !== null
				? globalPositionUpToCurrentEntry +
				  playerManagerState.innerState.position
				: null,
		currentGlobalDuration: currentGlobalDuration,
	}

	const isPositionCorrupted =
		playerManagerState.innerState.isSeeking ||
		playerManagerState.innerState.config.seekPosition !== null

	const lastValidPosition = isPositionCorrupted
		? lastValidPositionRef.current ?? currentPosition
		: currentPosition

	if (!isPositionCorrupted) lastValidPositionRef.current = currentPosition

	return {
		metadataBag: whatToPlayData.metadata,
		entries: whatToPlayData.entries,

		isPlaying: playerManagerState.innerState.config.isPlayingWhenReady,
		isSeeking: playerManagerState.innerState.isSeeking,
		sourceProvider: playerManagerState.innerState.config.sourceProvider, // TODO(teawithsand): add player source to state

		currentPosition,
		lastValidPosition,
		isPositionCorrupted,

		playerManagerState,
		whatToPlayData,
	}
}

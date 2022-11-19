import { PlayableEntry } from "@app/domain/defines/player/playableEntry"
import { useAppManager } from "@app/domain/managers/app"
import { PlayableEntriesBag } from "@app/domain/managers/playableEntriesBag"
import { PlayerManagerState } from "@app/domain/managers/playerManager"
import {
	WhatToPlayData,
	WhatToPlayDataType,
} from "@app/domain/managers/whatToPlayManager"
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
	entry: PlayableEntry | null

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
	entriesBag: PlayableEntriesBag

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
	// This bypass with ?? is required, since we want to use react hook
	// but wy can't inject early return, which would cause calling less of them in other render call
	const whatToPlayData: WhatToPlayData = useStickySubscribable(
		app.whatToPlayManager.bus
	) ?? {
		type: WhatToPlayDataType.USER_PROVIDED_ENTRIES,
		entriesBag: new PlayableEntriesBag([]),
		metadata: new MetadataBag([]),
		userProvidedEntries: [],
		entries: [],
	}

	const lastValidPositionRef = useRef<UiPlayerPositionData | null>(null)

	const provider = playerManagerState.innerState.config.sourceProvider
	const currentEntryId = playerManagerState.innerState.config.sourceKey
	const currentEntryIndex = useMemo(
		() =>
			currentEntryId !== null
				? whatToPlayData?.entriesBag?.findIndexById(currentEntryId)
				: null,
		[currentEntryId, whatToPlayData?.entriesBag]
	)

	const nextSourceId = useMemo(
		() => provider.getNextSourceKey(currentEntryId),
		[provider, currentEntryId]
	)

	const prevSourceId = useMemo(
		() => provider.getPrevSourceKey(currentEntryId),
		[provider, currentEntryId]
	)

	const currentMetadataEntry = (() => {
		const r =
			currentEntryIndex !== null
				? whatToPlayData.metadata.getResult(currentEntryIndex)
				: null
		if (!r || r.type !== MetadataLoadingResultType.OK) return null

		return r.metadata
	})()

	const globalPositionUpToCurrentEntry = useMemo(() => {
		return currentEntryIndex !== null
			? whatToPlayData.metadata.getDurationToIndex(currentEntryIndex)
			: null
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
		entry: currentEntryId
			? whatToPlayData.entriesBag.findById(currentEntryId)
			: null,
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
		entries: whatToPlayData.entriesBag.entries,
		entriesBag: whatToPlayData.entriesBag,

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

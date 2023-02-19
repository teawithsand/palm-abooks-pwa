import { useAppManager } from "@app/domain/managers/app"
import { PlayerEntryListMetadata } from "@app/domain/managers/newPlayer/list/metadata"
import { PlayerEntriesBag } from "@app/domain/managers/newPlayer/source/bag"
import { PlayerEntry } from "@app/domain/managers/newPlayer/source/entry"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import { useRef } from "react"

export type UiPlayerPositionData = {
	entry: PlayerEntry | null

	currentEntryDuration: number | null
	currentEntryPosition: number | null
	currentGlobalPosition: number | null
	currentGlobalDuration: number | null
}

export type UiPlayerData = {
	entriesBag: PlayerEntriesBag

	currentPosition: UiPlayerPositionData
	lastValidPosition: UiPlayerPositionData
	isPositionCorrupted: boolean

	isPlaying: boolean
	isSeeking: boolean

	metadata: PlayerEntryListMetadata
}

export const useUiPlayerData = (): UiPlayerData | null => {
	const app = useAppManager()
	const playerManagerState = useStickySubscribable(app.playerManager.bus)

	const lastValidPositionRef = useRef<UiPlayerPositionData | null>(null)

	const currentEntryPosition = playerManagerState.playerState.position

	const currentEntryId =
		playerManagerState.playerEntryListManagerState.currentEntryId
	const entriesBag =
		playerManagerState.playerEntryListManagerState.listState.entriesBag
	const currentEntry = currentEntryId
		? entriesBag.findById(currentEntryId)
		: null
	const currentEntryIndex = currentEntryId
		? entriesBag.findIndexById(currentEntryId)
		: null

	const currentEntryDuration = playerManagerState.playerState.duration

	const globalPositionUpToCurrentEntry = currentEntryIndex
		? entriesBag.metadataBag.getDurationToIndex(currentEntryIndex)
		: null

	const currentGlobalPosition =
		globalPositionUpToCurrentEntry && currentEntryPosition
			? currentEntryPosition + globalPositionUpToCurrentEntry
			: null

	const currentGlobalDuration = entriesBag.metadataBag.duration

	const currentPosition: UiPlayerPositionData = {
		entry: currentEntry,
		currentEntryDuration,
		currentEntryPosition,
		currentGlobalDuration,
		currentGlobalPosition,
	}

	const isPositionCorrupted =
		playerManagerState.playerState.isSeeking ||
		playerManagerState.playerState.config.seekPosition !== null ||
		playerManagerState.playerState.positionUpdatedAfterSeek

	const lastValidPosition = isPositionCorrupted
		? lastValidPositionRef.current ?? currentPosition
		: currentPosition

	if (!isPositionCorrupted) lastValidPositionRef.current = currentPosition

	return {
		entriesBag,

		isPlaying: playerManagerState.playerState.config.isPlayingWhenReady,
		isSeeking: playerManagerState.playerState.isSeeking,

		currentPosition,
		lastValidPosition,
		isPositionCorrupted,

		metadata: playerManagerState.playerEntryListManagerState.listMetadata,
	}
}

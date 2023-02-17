import { PlayableEntryType } from "@app/domain/defines/player/playableEntry"
import {
	AbsoluteSeekResolutionData,
	RelativeSeekResolutionData,
} from "@app/domain/defines/player/seek"
import {
	Position,
	PositionType,
	PositionVariants,
} from "@app/domain/defines/position"
import { SeekData, SeekType, TrivialSeekData } from "@app/domain/defines/seek"
import { isTimeNumber } from "@teawithsand/tws-player"
import { throwExpression } from "@teawithsand/tws-stl"

// TODO(teawithsand): split this into two/three procedures

export class PositionAndSeekDataResolver {
	public resolvePosition = (
		data: AbsoluteSeekResolutionData,
		position: Position
	): SeekData | null => {
		if (position.type === PositionType.FILE_ID_AND_LOCAL_OFFSET) {
			const entry = data.entriesBag.findById(position.fileId)
			if (!entry) return null

			return {
				type: SeekType.ABSOLUTE_TO_FILE,
				playableEntryId: position.fileId,
				positionMs: position.positionMs,
			}
		} else if (position.type === PositionType.FILE_NAME_AND_LOCAL_OFFSET) {
			const targetEntry = data.entriesBag.entries.find(
				(e) =>
					e.type === PlayableEntryType.FILE_ENTRY &&
					e.entry.name === position.fileName
			)
			if (!targetEntry) return null

			return {
				type: SeekType.ABSOLUTE_TO_FILE,
				playableEntryId: targetEntry.id,
				positionMs: position.positionMs,
			}
		} else if (position.type === PositionType.GLOBAL_OFFSET) {
			return {
				type: SeekType.ABSOLUTE_GLOBAL,
				positionMs: position.positionMs,
			}
		} else {
			throw new Error("Unreachable code")
		}
	}

	public resolvePositionVariants = (
		data: AbsoluteSeekResolutionData,
		position: PositionVariants
	): SeekData | null => {
		const variants: PositionType[] = [
			PositionType.FILE_ID_AND_LOCAL_OFFSET,
			PositionType.FILE_NAME_AND_LOCAL_OFFSET,
			PositionType.GLOBAL_OFFSET,
		]

		for (const v of variants) {
			const candidate = position[v]
			if (!candidate) continue
			const res = this.resolvePosition(data, candidate)
			if (res) return res
		}

		return null
	}

	public resolveSeekData = (
		data: RelativeSeekResolutionData,
		sd: SeekData
	): TrivialSeekData | null => {
		if (data.entriesBag.length !== data.metadataBag.length) {
			throw new Error(`Provided not matching metadata and entries bag`)
		}

		if (sd.type === SeekType.ABSOLUTE_TO_FILE) {
			return {
				playableEntryId: sd.playableEntryId,
				positionMs: sd.positionMs,
			}
		} else if (sd.type === SeekType.ABSOLUTE_IN_FILE) {
			if (data.currentSourceKey === null) return null

			return {
				playableEntryId: data.currentSourceKey,
				positionMs: sd.positionMs,
			}
		} else if (sd.type === SeekType.RELATIVE_IN_FILE) {
			if (
				data.currentSourceKey === null ||
				data.currentPosition === null ||
				!isTimeNumber(data.currentPosition)
			)
				return null

			return {
				playableEntryId: data.currentSourceKey,
				positionMs: Math.max(
					0,
					data.currentPosition + sd.positionDeltaMs
				),
			}
		} else if (
			sd.type === SeekType.ABSOLUTE_GLOBAL ||
			sd.type === SeekType.RELATIVE_GLOBAL
		) {
			let positionMs: number
			if (sd.type === SeekType.ABSOLUTE_GLOBAL) {
				positionMs = sd.positionMs
			} else {
				if (
					!isTimeNumber(data.currentPosition) ||
					data.currentPosition === null ||
					data.currentSourceKey === null
				)
					return null

				const currentFileIndex = data.entriesBag.findIndexById(
					data.currentSourceKey
				)
				if (currentFileIndex === null) return null

				const toCurrentFileDuration =
					data.metadataBag.getDurationToIndex(currentFileIndex)
				if (toCurrentFileDuration === null) return null

				positionMs = Math.max(
					0,
					toCurrentFileDuration +
						data.currentPosition +
						sd.positionDeltaMs
				)
			}

			if (!isTimeNumber(positionMs)) return null

			const index = data.metadataBag.getIndexFromPosition(positionMs)
			if (index === null) return null
			const offset =
				data.metadataBag.getDurationToIndex(index) ??
				throwExpression(new Error(`Unreachable code`))
			const entry =
				data.entriesBag.findByIndex(index) ??
				throwExpression(new Error(`Unreachable code`))

			return {
				playableEntryId: entry.id,
				positionMs: positionMs - offset,
			}
		}
		return null
	}
}

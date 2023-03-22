import { useAppManager } from "@app/domain/managers/app"
import React, { useEffect } from "react"

export const PlayerKeyboardShortcut = () => {
	const { playerActionsManager } = useAppManager()

	// TODO(teawithsand): make sure that user didn't focus some kind of text field
	// since that would execute action each time such key is clicked
	useEffect(() => {
		const listener = (e: KeyboardEvent) => {
			if (e.key === " ") {
				playerActionsManager.togglePlay()
			}
		}
		window.addEventListener("keydown", listener)
		return () => {
			window.removeEventListener("keydown", listener)
		}
	}, [playerActionsManager])

	return <></>
}

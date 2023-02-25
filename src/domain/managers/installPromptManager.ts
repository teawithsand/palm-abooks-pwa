import { DefaultStickyEventBus, StickySubscribable } from "@teawithsand/tws-stl"

export enum InstallPromptManagerStateType {
	NOT_RECEIVED = 1,
	RECEIVED_NOT_USED_YET = 2,
	RECEIVED_AND_USED = 3,
}

export type InstallPromptManagerState = {
	type: InstallPromptManagerStateType
}
export class InstallPromptManager {
	private readonly innerBus =
		new DefaultStickyEventBus<InstallPromptManagerState>({
			type: InstallPromptManagerStateType.NOT_RECEIVED,
		})

	private deferredPrompt: any | null = null

	get bus(): StickySubscribable<InstallPromptManagerState> {
		return this.innerBus
	}

	// TODO(teawithsand): remove this method as essentially it's nothing but hack
	dismiss = () => {
		this.innerBus.emitEvent({
			type: InstallPromptManagerStateType.RECEIVED_AND_USED,
		})
	}

	triggerPromptIfAvailable = () => {
		if (this.deferredPrompt && "prompt" in this.deferredPrompt) {
			this.deferredPrompt.prompt()
			this.innerBus.emitEvent({
				type: InstallPromptManagerStateType.RECEIVED_AND_USED,
			})
		}
		this.deferredPrompt = null
	}

	constructor() {}

	initialize = () => {
		window.addEventListener("beforeinstallprompt", (e) => {
			// Prevents the default mini-infobar or install dialog from appearing on mobile
			e.preventDefault()
			// Save the event because you'll need to trigger it later.
			this.deferredPrompt = e
			this.innerBus.emitEvent({
				type: InstallPromptManagerStateType.RECEIVED_NOT_USED_YET,
			})
		})
	}
}

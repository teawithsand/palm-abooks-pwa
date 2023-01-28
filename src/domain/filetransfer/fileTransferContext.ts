import { PeerHelper, generateSecureClientId } from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	throwExpression,
} from "@teawithsand/tws-stl"
import { createContext, useContext } from "react"

export class FileTransferStateManager {
	private readonly innerAuthSecretBus = new DefaultStickyEventBus(
		generateSecureClientId()
	)
	constructor(public readonly peerHelper: PeerHelper) {}

	get authSecretBus(): StickySubscribable<string> {
		return this.innerAuthSecretBus
	}

	regenerateAuthSecret = () => {
		this.innerAuthSecretBus.emitEvent(generateSecureClientId())
	}

	close = () => {
		this.peerHelper.setConfig(null)
	}
}

export const FileTransferStateManagerContext =
	createContext<FileTransferStateManager | null>(null)

export const useFileTransferStateManager = () =>
	useContext(FileTransferStateManagerContext) ??
	throwExpression(new Error("No peer helper found"))

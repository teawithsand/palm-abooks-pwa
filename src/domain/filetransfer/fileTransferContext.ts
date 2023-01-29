import { IPeer, PeerJSIPeer, generateSecureClientId } from "@teawithsand/tws-peer"
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
	constructor(public readonly peer: PeerJSIPeer) {}

	get authSecretBus(): StickySubscribable<string> {
		return this.innerAuthSecretBus
	}

	regenerateAuthSecret = () => {
		this.innerAuthSecretBus.emitEvent(generateSecureClientId())
	}

	close = () => {
		this.peer.close()
	}
}

export const FileTransferStateManagerContext =
	createContext<FileTransferStateManager | null>(null)

export const useFileTransferStateManager = () =>
	useContext(FileTransferStateManagerContext) ??
	throwExpression(new Error("No peer helper found"))

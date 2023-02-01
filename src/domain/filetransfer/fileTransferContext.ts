import { isFileTransferAuthNameValid } from "@app/domain/filetransfer/defines"
import { PeerJSIPeer, generateSecureClientId } from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	generateUUID,
	throwExpression,
} from "@teawithsand/tws-stl"
import { createContext, useContext } from "react"

export type FileTransferStateManagerState = {
	authSecret: string
	name: string
}

export class FileTransferStateManager {
	private readonly innerAuthSecretBus =
		new DefaultStickyEventBus<FileTransferStateManagerState>({
			authSecret: generateSecureClientId(),
			name: generateUUID(),
		})
	constructor(public readonly peer: PeerJSIPeer) {}

	get authSecretBus(): StickySubscribable<FileTransferStateManagerState> {
		return this.innerAuthSecretBus
	}

	regenerateAuthSecret = () => {
		this.innerAuthSecretBus.emitEvent({
			...this.innerAuthSecretBus.lastEvent,
			authSecret: generateSecureClientId(),
		})
	}

	setName = (name: string) => {
		if (!isFileTransferAuthNameValid(name)) throw new Error("Invalid name")

		this.innerAuthSecretBus.emitEvent({
			...this.innerAuthSecretBus.lastEvent,
			name,
		})
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

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
	private readonly innerStateBus =
		new DefaultStickyEventBus<FileTransferStateManagerState>({
			authSecret: generateSecureClientId(),
			name: generateUUID(),
		})
	constructor(public readonly peer: PeerJSIPeer) {}

	get stateBus(): StickySubscribable<FileTransferStateManagerState> {
		return this.innerStateBus
	}

	regenerateAuthSecret = () => {
		this.innerStateBus.emitEvent({
			...this.innerStateBus.lastEvent,
			authSecret: generateSecureClientId(),
		})
	}

	setName = (name: string) => {
		if (!isFileTransferAuthNameValid(name)) throw new Error("Invalid name")

		this.innerStateBus.emitEvent({
			...this.innerStateBus.lastEvent,
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

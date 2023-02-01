import {
	FileTransferAuthType,
	FileTransferEntry,
} from "@app/domain/filetransfer/defines"
import { FileTransferStateManager } from "@app/domain/filetransfer/fileTransferContext"
import {
	SenderAdapterConnStage,
	SenderConnAdapter,
} from "@app/domain/filetransfer/senderAdapter"
import { ConnRegistry, IPeerEventType } from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
	throwExpression,
} from "@teawithsand/tws-stl"
import produce from "immer"
import { createContext, useContext } from "react"

export class SenderStateManager {
	public readonly registry = new ConnRegistry(new SenderConnAdapter())
	private readonly innerEntriesBus = new DefaultStickyEventBus<
		FileTransferEntry[]
	>([])

	private fileTransferStateManagerSubscriptionCanceller: SubscriptionCanceler | null =
		null

	constructor(fileTransferStateManager: FileTransferStateManager) {
		this.fileTransferStateManagerSubscriptionCanceller =
			fileTransferStateManager.peer.eventBus.addSubscriber((event) => {
				if (event.type === IPeerEventType.MEDIA_CONN) {
					event.conn.close()
				} else if (event.type === IPeerEventType.DATA_CONN) {
					const { lastEvent } = fileTransferStateManager.authSecretBus
					const id = this.registry.addConn(event.conn, {
						auth: {
							type: FileTransferAuthType.REQUEST,
							authSecret: lastEvent.authSecret,
							name: lastEvent.name,
						},
						entries: this.entriesBus.lastEvent,
					})

					this.registry.updateConfig(id, (cfg) =>
						produce(cfg, (draft) => {
							draft.stage =
								SenderAdapterConnStage.AUTHENTICATE_SEND_HEADERS
						})
					)
				}
			})
	}

	get entriesBus(): StickySubscribable<FileTransferEntry[]> {
		return this.innerEntriesBus
	}

	setEntries = (entries: FileTransferEntry[]) => {
		this.innerEntriesBus.emitEvent(entries)
	}

	/**
	 * Removes all connections from conn registry.
	 */
	purgeConnRegistry = () => {
		for (const key of Object.keys(this.registry.stateBus.lastEvent)) {
			this.registry.setConfig(key, {
				stage: SenderAdapterConnStage.CLOSE,
			})
			// TODO(teawithsand): fix remove conn bug in registry implementation
			//  right now conn may be re-added by some event even if it was removed
			this.registry.removeConn(key)
		}
	}

	close = () => {
		if (this.fileTransferStateManagerSubscriptionCanceller) {
			this.fileTransferStateManagerSubscriptionCanceller()
			this.fileTransferStateManagerSubscriptionCanceller = null
		}

		this.purgeConnRegistry()
	}
}

export const SenderStateManagerContext =
	createContext<SenderStateManager | null>(null)

export const useSenderStateManager = () =>
	useContext(SenderStateManagerContext) ??
	throwExpression(new Error("No peer helper found"))

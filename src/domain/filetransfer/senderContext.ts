import {
	FileTransferAuthType,
	FileTransferEntry,
} from "@app/domain/filetransfer/defines"
import { FileTransferStateManager } from "@app/domain/filetransfer/fileTransferContext"
import {
	SenderAdapterConnStage,
	SenderConnAdapter,
} from "@app/domain/filetransfer/senderAdapter"
import { ConnRegistry, PeerEventType } from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	SubscriptionCanceler,
	throwExpression,
} from "@teawithsand/tws-stl"
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
			fileTransferStateManager.peerHelper.peerBus.addSubscriber(
				(event) => {
					if (event.type === PeerEventType.CALL) {
						event.call.close()
					} else if (event.type === PeerEventType.CONNECT) {
						this.registry.addConn(
							{
								conn: event.conn,
								peer:
									fileTransferStateManager.peerHelper.stateBus
										.lastEvent.peer ??
									throwExpression(
										new Error("Unreachable code")
									),
							},
							{
								auth: {
									type: FileTransferAuthType.REQUEST,
									authSecret:
										fileTransferStateManager.authSecretBus
											.lastEvent,
								},
								entries: this.entriesBus.lastEvent,
							}
						)
					}
				}
			)
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

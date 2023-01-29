import { FileTransferAuthType } from "@app/domain/filetransfer/defines"
import { FileTransferStateManager } from "@app/domain/filetransfer/fileTransferContext"
import {
	ReceiverAdapterConnStage,
	ReceiverConnAdapter,
} from "@app/domain/filetransfer/receiverAdapter"
import { ConnRegistry, PeerEventType } from "@teawithsand/tws-peer"
import { SubscriptionCanceler, throwExpression } from "@teawithsand/tws-stl"
import produce from "immer"
import { createContext, useContext } from "react"

export class ReceiverStateManager {
	public readonly registry = new ConnRegistry(new ReceiverConnAdapter())

	private fileTransferStateManagerSubscriptionCanceller: SubscriptionCanceler | null =
		null

	constructor(fileTransferStateManager: FileTransferStateManager) {
		this.fileTransferStateManagerSubscriptionCanceller =
			fileTransferStateManager.peerHelper.peerBus.addSubscriber(
				(event) => {
					if (event.type === PeerEventType.CALL) {
						event.call.close()
					} else if (event.type === PeerEventType.CONNECT) {
						const id = this.registry.addConn(
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
							}
						)

						this.registry.updateConfig(id, (cfg) =>
							produce(cfg, (draft) => {
								draft.stage =
									ReceiverAdapterConnStage.AUTHENTICATE_RECEIVE_HEADER
							})
						)
					}
				}
			)
	}

	/**
	 * Removes all connections from conn registry.
	 */
	purgeConnRegistry = () => {
		for (const key of Object.keys(this.registry.stateBus.lastEvent)) {
			this.registry.setConfig(key, {
				stage: ReceiverAdapterConnStage.CLOSE,
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

export const ReceiverStateManagerContext =
	createContext<ReceiverStateManager | null>(null)

export const useReceiverStateManager = () =>
	useContext(ReceiverStateManagerContext) ??
	throwExpression(new Error("No peer helper found"))

import { ConnOpener } from "@app/components/filetransfer/exchange/ConnOpener"
import { useTokenData } from "@app/components/filetransfer/useToken"
import {
	FileTransferAuthType,
	ReceiverAdapterConnStage,
	useFileTransferStateManager,
	useReceiverStateManager,
} from "@app/domain/filetransfer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import produce from "immer"
import React from "react"

export const ReceiverConnOpener = () => {
	const senderStateManager = useReceiverStateManager()
	const fileTransferStateManager = useFileTransferStateManager()
	const token = useTokenData()

	const peer = fileTransferStateManager.peer

	const peerState = useStickySubscribable(peer.stateBus)

	return (
		<ConnOpener
			disabled={!peerState.isReady || !peerState.id}
			token={token}
			onToken={async (token) => {
				console.log("Token received", token)
				if (!peer) return

				if (peer.stateBus.lastEvent.id === token.peerId) return

				const conn = await peer.connect(token.peerId)
				const id = senderStateManager.registry.addConn(conn, {
					auth: {
						type: FileTransferAuthType.PROVIDE,
						authSecret: token.authId,
					},
				})

				senderStateManager.registry.updateConfig(id, (cfg) =>
					produce(cfg, (draft) => {
						draft.stage =
							ReceiverAdapterConnStage.AUTHENTICATE_RECEIVE_HEADER
					})
				)
			}}
		/>
	)
}

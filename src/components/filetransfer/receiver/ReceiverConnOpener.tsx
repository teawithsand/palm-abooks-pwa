import { ConnOpener } from "@app/components/filetransfer/exchange/ConnOpener"
import { useTokenData } from "@app/components/filetransfer/useToken"
import {
	FileTransferAuthType,
	ReceiverAdapterConnStage,
	useFileTransferStateManager,
	useReceiverStateManager,
} from "@app/domain/filetransfer"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import produce from "immer"
import React from "react"

export const ReceiverConnOpener = () => {
	const senderStateManager = useReceiverStateManager()
	const fileTransferStateManager = useFileTransferStateManager()
	const token = useTokenData()

	const peer = useStickySubscribableSelector(
		fileTransferStateManager.peerHelper.stateBus,
		(state) => state.peer
	)

	return (
		<ConnOpener
			disabled={!peer}
			token={token}
			onToken={(token) => {
				console.log("Token received", token)
				if (!peer) return

				if (peer.id === token.peerId) return

				const conn = peer.connect(token.peerId)
				const id = senderStateManager.registry.addConn(
					{
						conn,
						peer,
					},
					{
						auth: {
							type: FileTransferAuthType.PROVIDE,
							authSecret: token.authId,
						},
					}
				)

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

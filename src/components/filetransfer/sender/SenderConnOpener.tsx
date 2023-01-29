import { ConnOpener } from "@app/components/filetransfer/exchange/ConnOpener"
import { useTokenData } from "@app/components/filetransfer/useToken"
import {
	FileTransferAuthType,
	SenderAdapterConnStage,
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import produce from "immer"
import React from "react"

export const SenderConnOpener = () => {
	const senderStateManager = useSenderStateManager()
	const fileTransferStateManager = useFileTransferStateManager()
	const token = useTokenData()

	const peer = fileTransferStateManager.peer

	const entries = useStickySubscribable(senderStateManager.entriesBus)
	const peerState = useStickySubscribable(peer.stateBus)

	return (
		<ConnOpener
			disabled={
				!peerState.isReady || !peerState.id
			}
			token={token}
			onToken={async (token) => {
				if (!peer) return

				if (peer.stateBus.lastEvent.id === token.peerId) return

				const conn = await peer.connect(token.peerId)
				const id = senderStateManager.registry.addConn(conn, {
					auth: {
						type: FileTransferAuthType.PROVIDE,
						authSecret: token.authId,
					},
					entries,
				})

				senderStateManager.registry.updateConfig(id, (cfg) =>
					produce(cfg, (draft) => {
						draft.stage =
							SenderAdapterConnStage.AUTHENTICATE_SEND_HEADERS
					})
				)
			}}
		/>
	)
}

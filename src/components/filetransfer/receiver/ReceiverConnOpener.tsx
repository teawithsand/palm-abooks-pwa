import { ConnOpener } from "@app/components/filetransfer/exchange/ConnOpener"
import {
	useConnectAuthFactory,
	useTokenData,
} from "@app/components/filetransfer/useToken"
import {
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
	const factory = useConnectAuthFactory()

	const peer = fileTransferStateManager.peer

	const peerState = useStickySubscribable(peer.stateBus)

	return (
		<ConnOpener
			disabled={!peerState.isReady}
			token={token}
			onToken={async (token) => {
				if (!peer) return
				if (peer.stateBus.lastEvent.id === token.peerId) return

				const conn = await peer.connect(token.peerId)
				const id = senderStateManager.registry.addConn(conn, {
					auth: factory(token),
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

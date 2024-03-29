import { ConnOpener } from "@app/components/filetransfer/exchange/ConnOpener"
import {
	useConnectAuthFactory,
	useTokenData,
} from "@app/components/filetransfer/useToken"
import {
	SenderAdapterConnStage,
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import produce from "immer"
import React from "react"

export const SenderConnOpener = () => {
	const senderStateManager = useSenderStateManager()
	const fileTransferStateManager = useFileTransferStateManager()
	const token = useTokenData()
	const factory = useConnectAuthFactory()

	const peer = fileTransferStateManager.peer

	const data = useStickySubscribable(senderStateManager.dataBus)
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
					...data,
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

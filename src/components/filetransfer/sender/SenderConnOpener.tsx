import { ConnOpener } from "@app/components/filetransfer/exchange/ConnOpener"
import { useTokenData } from "@app/components/filetransfer/useToken"
import {
	FileTransferAuthType,
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React from "react"

export const SenderConnOpener = () => {
	const senderStateManager = useSenderStateManager()
	const fileTransferStateManager = useFileTransferStateManager()
	const token = useTokenData()

	const peer = useStickySubscribableSelector(
		fileTransferStateManager.peerHelper.stateBus,
		(state) => state.peer
	)

	const entries = useStickySubscribable(senderStateManager.entriesBus)

	return (
		<ConnOpener
			disabled={!peer}
			token={token}
			onToken={(token) => {
				if (!peer) return

				if (token.peerId === token.peerId) return

				const conn = peer.connect(token.peerId)
				senderStateManager.registry.addConn(
					{
						conn,
						peer,
					},
					{
						auth: {
							type: FileTransferAuthType.PROVIDE,
							authSecret: token.authId,
						},
						entries,
					}
				)
			}}
		/>
	)
}

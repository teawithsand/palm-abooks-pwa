import { SenderTransfersSpy } from "@app/components/filetransfer/sender/SenderTransfersSpy"
import {
	FileSender,
	FileTransferAuthType,
	FileTransferEntry,
	FileTransferTokenData,
} from "@app/domain/filetransfer"
import { Peer } from "@teawithsand/tws-peer"
import React, { useEffect, useMemo } from "react"

export const SenderAcceptPerformer = (props: {
	peer: Peer
	authSecret: string
	entries: FileTransferEntry[]
}) => {
	const { peer, authSecret: token, entries } = props

	const sender = useMemo(() => new FileSender(), [peer, token, entries])

	useEffect(() => {
		sender.updateConfig((draft) => {
			draft.auth = {
				type: FileTransferAuthType.REQUEST,
				authSecret: token,
			}
			draft.entries = entries
			draft.acceptConnections = true
		})

		sender.listenOnPeer(peer)

		return () => {
			peer.destroy()
		}
	}, [peer, token, entries, sender])

	return (
		<div>
			<SenderTransfersSpy sender={sender} />
		</div>
	)
}

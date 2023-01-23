import { SenderTransfersSpy } from "@app/components/filetransfer/sender/SenderTransfersSpy"
import { FileSender, FileTransferAuthType, FileTransferEntry, FileTransferTokenData } from "@app/domain/filetransfer"
import { Peer } from "@teawithsand/tws-peer"
import React, { useEffect, useMemo } from "react"

export const SenderConnectPerformer = (props: {
    peer: Peer,
    token: FileTransferTokenData,
    entries: FileTransferEntry[],
}) => {
    const { peer, token, entries } = props

    const sender = useMemo(() => new FileSender(), [peer, token, entries])

    useEffect(() => {
        sender.updateConfig(draft => {
            draft.auth = {
                type: FileTransferAuthType.PROVIDE,
                authSecret: token.authId,
            }
            draft.entries = entries
            draft.acceptConnections = false
        })

        sender.handleConn(peer, peer.connect(token.peerId))

        return () => {
			peer.destroy()
		}
    }, [peer, token, entries, sender])

    return <div>
        <SenderTransfersSpy sender={sender} />
    </div>
}
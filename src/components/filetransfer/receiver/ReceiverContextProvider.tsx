import {
	FileTransferStateManager,
	FileTransferStateManagerContext,
	ReceiverStateManager,
	ReceiverStateManagerContext,
} from "@app/domain/filetransfer"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import React, { ReactNode, useEffect, useMemo } from "react"

export const ReceiverContextProvider = (props: { children?: ReactNode }) => {
	const fileTransferStateManager = useMemo(
		() => new FileTransferStateManager(new PeerJSIPeer()),
		[]
	)
	const receiverStateManager = useMemo(
		() => new ReceiverStateManager(fileTransferStateManager),
		[fileTransferStateManager]
	)

	useEffect(() => {
		fileTransferStateManager.peer.setConfig({
			acceptDataConnections: true,
			acceptMediaConnections: false,
		})
	}, [fileTransferStateManager])

	useEffect(() => {
		return () => {
			receiverStateManager.close()
		}
	}, [receiverStateManager])

	useEffect(() => {
		return () => {
			fileTransferStateManager.close()
		}
	}, [fileTransferStateManager])

	return (
		<ReceiverStateManagerContext.Provider value={receiverStateManager}>
			<FileTransferStateManagerContext.Provider
				value={fileTransferStateManager}
			>
				{props.children}
			</FileTransferStateManagerContext.Provider>
		</ReceiverStateManagerContext.Provider>
	)
}

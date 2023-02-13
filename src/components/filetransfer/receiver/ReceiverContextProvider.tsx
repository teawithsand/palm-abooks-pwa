import {
	FileTransferStateManager,
	FileTransferStateManagerContext,
	ReceiverStateManager,
	ReceiverStateManagerContext,
} from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import React, { ReactNode, useEffect, useMemo } from "react"

export const ReceiverContextProvider = (props: { children?: ReactNode }) => {
	const configManager = useAppManager().configManager
	const fileTransferStateManager = useMemo(
		() => new FileTransferStateManager(new PeerJSIPeer(), configManager),
		[configManager]
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

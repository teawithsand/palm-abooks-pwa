import {
	FileTransferStateManager,
	FileTransferStateManagerContext,
	ReceiverStateManager,
	ReceiverStateManagerContext,
} from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import React, { ReactNode, useEffect, useState } from "react"

export const ReceiverContextProvider = (props: { children?: ReactNode }) => {
	const configManager = useAppManager().configManager

	// Hack to bypass SSR
	const [fileTransferStateManager, setFileTransferStateManager] =
		useState<FileTransferStateManager | null>(null)
	const [receiverStateManager, setReceiverStateManager] =
		useState<ReceiverStateManager | null>(null)

	useEffect(() => {
		setFileTransferStateManager(
			new FileTransferStateManager(new PeerJSIPeer(), configManager)
		)
	}, [configManager])

	useEffect(() => {
		if (!fileTransferStateManager) return

		setReceiverStateManager(
			new ReceiverStateManager(fileTransferStateManager)
		)
	}, [fileTransferStateManager])

	useEffect(() => {
		if (!fileTransferStateManager) return
		fileTransferStateManager.peer.setConfig({
			acceptDataConnections: true,
			acceptMediaConnections: false,
		})
	}, [fileTransferStateManager])

	useEffect(() => {
		if (!receiverStateManager) return
		return () => {
			receiverStateManager.close()
		}
	}, [receiverStateManager])

	useEffect(() => {
		if (!fileTransferStateManager) return
		return () => {
			fileTransferStateManager.close()
		}
	}, [fileTransferStateManager])

	if (!receiverStateManager || !fileTransferStateManager) return <></>

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

import {
	FileTransferData,
	FileTransferStateManager,
	FileTransferStateManagerContext,
	SenderStateManager,
	SenderStateManagerContext,
} from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import React, { ReactNode, useEffect, useMemo } from "react"

export const SenderContextProvider = (props: {
	data?: FileTransferData
	children?: ReactNode
}) => {
	const { data: data } = props
	const configManager = useAppManager().configManager

	const fileTransferStateManager = useMemo(
		() => new FileTransferStateManager(new PeerJSIPeer(), configManager),
		[configManager]
	)
	const senderStateManager = useMemo(
		() => new SenderStateManager(fileTransferStateManager),
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
			senderStateManager.close()
		}
	}, [senderStateManager])

	useEffect(() => {
		return () => {
			fileTransferStateManager.close()
		}
	}, [fileTransferStateManager])

	useEffect(() => {
		if (data) senderStateManager.setFileTransferData(data)
	}, [data, senderStateManager])

	return (
		<SenderStateManagerContext.Provider value={senderStateManager}>
			<FileTransferStateManagerContext.Provider
				value={fileTransferStateManager}
			>
				{props.children}
			</FileTransferStateManagerContext.Provider>
		</SenderStateManagerContext.Provider>
	)
}

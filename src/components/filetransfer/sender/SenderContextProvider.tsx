import {
	FileTransferData,
	FileTransferStateManager,
	FileTransferStateManagerContext,
	SenderStateManager,
	SenderStateManagerContext,
} from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React, { ReactNode, useEffect, useState } from "react"

const InnerSenderContextProvider = (props: {
	data?: FileTransferData
	children?: ReactNode
}) => {
	const { data: data } = props
	const configManager = useAppManager().configManager

	// Hack to bypass SSR
	const [fileTransferStateManager, setFileTransferStateManager] =
		useState<FileTransferStateManager | null>(null)
	const [senderStateManager, setSenderStateManager] =
		useState<SenderStateManager | null>(null)

	useEffect(() => {
		setFileTransferStateManager(
			new FileTransferStateManager(new PeerJSIPeer(), configManager)
		)
	}, [configManager])

	useEffect(() => {
		if (!fileTransferStateManager) return

		setSenderStateManager(new SenderStateManager(fileTransferStateManager))
	}, [fileTransferStateManager])

	useEffect(() => {
		if (!fileTransferStateManager) return
		fileTransferStateManager.peer.setConfig({
			acceptDataConnections: true,
			acceptMediaConnections: false,
		})
	}, [fileTransferStateManager])

	useEffect(() => {
		if (!senderStateManager) return
		return () => {
			senderStateManager.close()
		}
	}, [senderStateManager])

	useEffect(() => {
		if (!fileTransferStateManager) return
		return () => {
			fileTransferStateManager.close()
		}
	}, [fileTransferStateManager])

	useEffect(() => {
		if (!senderStateManager) return
		if (data) senderStateManager.setFileTransferData(data)
	}, [data, senderStateManager])

	if (!senderStateManager || !fileTransferStateManager) {
		return <></>
	}

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

export const SenderContextProvider = wrapNoSSR(InnerSenderContextProvider)

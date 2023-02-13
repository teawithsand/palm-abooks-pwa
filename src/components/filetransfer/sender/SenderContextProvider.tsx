import {
	FileTransferEntry,
	FileTransferStateManager,
	FileTransferStateManagerContext,
	SenderStateManager,
	SenderStateManagerContext,
} from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import React, { ReactNode, useEffect, useMemo } from "react"

export const SenderContextProvider = (props: {
	entries?: FileTransferEntry[]
	children?: ReactNode
}) => {
	const { entries } = props
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
		if (entries) senderStateManager.setEntries(entries)
	}, [entries, senderStateManager])

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

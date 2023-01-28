import {
	useSenderStateManager,
	useFileTransferStateManager,
} from "@app/domain/filetransfer"
import React from "react"

export const SenderAuthCodeReceiver = () => {
	const fileTransferManager = useFileTransferStateManager()
	const senderManager = useSenderStateManager()

	return <></>
}

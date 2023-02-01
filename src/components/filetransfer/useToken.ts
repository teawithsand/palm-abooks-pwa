import {
	FileTransferAuth,
	FileTransferAuthType,
	FileTransferTokenData,
	useFileTransferStateManager,
} from "@app/domain/filetransfer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import { useMemo } from "react"

export const useConnectAuthFactory = (): ((
	token: FileTransferTokenData
) => FileTransferAuth) => {
	const transferStateManager = useFileTransferStateManager()
	const state = useStickySubscribable(transferStateManager.stateBus)

	return (token: FileTransferTokenData) => {
		return {
			type: FileTransferAuthType.PROVIDE,
			authSecret: token.authId,
			name: state.name,
		}
	}
}

export const useTokenData = (): FileTransferTokenData => {
	const transferStateManager = useFileTransferStateManager()
	const state = useStickySubscribable(transferStateManager.stateBus)
	const peerId = useStickySubscribableSelector(
		transferStateManager.peer.stateBus,
		(state) => state.id ?? ""
	)

	return useMemo(
		() => ({
			authId: state.authSecret,
			peerId,
		}),
		[state, peerId]
	)
}

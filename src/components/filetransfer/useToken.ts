import { useFileTransferStateManager } from "@app/domain/filetransfer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import { useMemo } from "react"

export const useTokenData = () => {
	const transferStateManager = useFileTransferStateManager()
	const authSecret = useStickySubscribable(transferStateManager.authSecretBus)
	const peerId = useStickySubscribableSelector(
		transferStateManager.peer.stateBus,
		(state) => state.id ?? ""
	)

	return useMemo(
		() => ({
			authId: authSecret,
			peerId,
		}),
		[authSecret, peerId]
	)
}

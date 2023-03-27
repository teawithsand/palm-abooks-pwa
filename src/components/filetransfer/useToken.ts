import {
	FileTransferAuth,
	FileTransferAuthType,
	FileTransferTokenData,
	useFileTransferStateManager,
} from "@app/domain/filetransfer"
import { PeerJSIPeer } from "@teawithsand/tws-peer"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import { useMemo } from "react"

export const makePeer = () => {
	const peer = new PeerJSIPeer()
	// TODO(teawithsand): set up my own TURN server, in a way, which will make it just work
	// peer.setPeerJsConfig({
	// 	config: {
	// 		iceServers: [
	// 			{ urls: "stun:stun.l.google.com:19302" },
	// 			{
	// 				urls: "turn:turn.palmabooks.com",
	// 				credential: "f0pf3C1PRTQxDKH1lrioZttpL25BCocP",
	// 				username: "sendfiles"
	// 			},
	// 		],
	// 	},
	// })
	return peer
}

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

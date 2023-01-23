import { AuthCodeReceiver } from "@app/components/filetransfer/exchange/AuthCodeReceiver"
import { AuthCodeSender } from "@app/components/filetransfer/exchange/AuthCodeSender"
import { SenderAcceptPerformer } from "@app/components/filetransfer/sender/SenderAcceptPerformer"
import { SenderConnectPerformer } from "@app/components/filetransfer/sender/SenderConnectPerfomer"
import {
	FileTransferEntry,
	FileTransferTokenData,
} from "@app/domain/filetransfer"
import { Peer, generateSecureClientId } from "@teawithsand/tws-peer"
import { generateUUID } from "@teawithsand/tws-stl"
import {
	StateContextProvider,
	makeStateContext,
	useStateContext,
} from "@teawithsand/tws-stl-react"
import React, { createContext, useContext, useMemo } from "react"
import { Button } from "react-bootstrap"

export enum SenderStateType {
	PICK_AUTH_SEND_OR_RECEIVE = 1,
	SEND_AUTH_CODE = 2,
	RECEIVE_AUTH_CODE = 3,
	PERFORM_SENDING_CONNECT = 4,
	PERFORM_SENDING_ACCEPT = 5,
}

export type SenderState =
	| {
			type: SenderStateType.PICK_AUTH_SEND_OR_RECEIVE
	  }
	| {
			type: SenderStateType.SEND_AUTH_CODE
			token: FileTransferTokenData
	  }
	| {
			type: SenderStateType.RECEIVE_AUTH_CODE
	  }
	| {
			type: SenderStateType.PERFORM_SENDING_CONNECT
			token: FileTransferTokenData
	  }
	| {
			type: SenderStateType.PERFORM_SENDING_ACCEPT
			authSecret: string
	  }

const SenderStateContext = makeStateContext<SenderState>()
const SenderConstantsContext = createContext<{
	peer: Peer
	entries: FileTransferEntry[]
}>(null as any) // HACK(teawithsand): implement some proper not-set value

const FileSendHelperStatePicker = () => {
	const [state, setState] = useStateContext(SenderStateContext)
	const constants = useContext(SenderConstantsContext)

	if (state.type === SenderStateType.PICK_AUTH_SEND_OR_RECEIVE) {
		return (
			<div>
				<Button
					onClick={() => {
						setState({
							...state,
							type: SenderStateType.SEND_AUTH_CODE,
							token: {
								authId: generateSecureClientId(),
								peerId: generateUUID(),
							},
						})
					}}
				>
					Send code
				</Button>
				<Button
					onClick={() => {
						setState({
							type: SenderStateType.RECEIVE_AUTH_CODE,
						})
					}}
				>
					Receive code
				</Button>
			</div>
		)
	} else if (state.type === SenderStateType.SEND_AUTH_CODE) {
		return (
			<div>
				<AuthCodeSender token={state.token} />
				<Button
					onClick={() => {
						setState({
							type: SenderStateType.PERFORM_SENDING_ACCEPT,
							authSecret: state.token.authId, // peer id should match, but authId has to be passed somehow
						})
					}}
				>
					I am done! Take me to file sending!
				</Button>
			</div>
		)
	} else if (state.type === SenderStateType.RECEIVE_AUTH_CODE) {
		return (
			<div>
				<AuthCodeReceiver
					onToken={(token) => {
						setState({
							type: SenderStateType.PERFORM_SENDING_CONNECT,
							token,
						})
					}}
				/>
			</div>
		)
	} else if (state.type === SenderStateType.PERFORM_SENDING_CONNECT) {
		return (
			<div>
				<SenderConnectPerformer
					entries={constants.entries}
					peer={constants.peer}
					token={state.token}
				/>
			</div>
		)
	} else if (state.type === SenderStateType.PERFORM_SENDING_ACCEPT) {
		return (
			<div>
				<SenderAcceptPerformer
					entries={constants.entries}
					peer={constants.peer}
					authSecret={state.authSecret}
				/>
			</div>
		)
	} else {
		throw new Error("Unreachable code")
	}
}

/**
 * This component:
 * 1. Assumes that one already has peer
 * 2. Assumes that one already has files picked
 *
 * Then it guides user through file sending process.
 */
export const FileSendHelperComponent = (props: {
	entries: FileTransferEntry[]
	peer: Peer
}) => {
	const { peer, entries } = props

	const initState: SenderState = useMemo(
		() => ({
			type: SenderStateType.PICK_AUTH_SEND_OR_RECEIVE,
		}),
		[peer, entries]
	)

	const value = useMemo(
		() => ({
			peer,
			entries,
		}),
		[peer, entries]
	)

	return (
		<SenderConstantsContext.Provider value={value}>
			<StateContextProvider
				ctx={SenderStateContext}
				initValue={initState}
			>
				<FileSendHelperStatePicker />
			</StateContextProvider>
		</SenderConstantsContext.Provider>
	)
}

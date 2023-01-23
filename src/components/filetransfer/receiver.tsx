import { FileTransferTokenData } from "@app/domain/filetransfer"

export enum ReceiverStateType {
	PICK_AUTH_SEND_OR_RECEIVE = 1,
	SEND_AUTH_CODE = 2,
	RECEIVE_AUTH_CODE = 3,
	PERFORM_RECEIVING_CONNECT = 4,
	PERFORM_RECEIVING_ACCEPT = 5,
}

export type ReceiverState =
	| {
			type: ReceiverStateType.PICK_AUTH_SEND_OR_RECEIVE
	  }
	| {
			type: ReceiverStateType.SEND_AUTH_CODE
			token: FileTransferTokenData
	  }
	| {
			type: ReceiverStateType.RECEIVE_AUTH_CODE
	  }
	| {
			type: ReceiverStateType.PERFORM_RECEIVING_CONNECT
			token: FileTransferTokenData
	  }
	| {
			type: ReceiverStateType.PERFORM_RECEIVING_ACCEPT
			authSecret: string
	  }

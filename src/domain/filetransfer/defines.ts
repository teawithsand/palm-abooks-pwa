import { DataConnection, Peer } from "@teawithsand/tws-peer"

export enum FileTransferAuthType {
	REQUEST = 1,
	PROVIDE = 2,
}

export type FileTransferAuth =
	| {
			type: FileTransferAuthType.PROVIDE
			authSecret: string
	  }
	| {
			type: FileTransferAuthType.REQUEST
			authSecret: string
	  }

export interface FileTransferEntry {
	publicName: string
	sha512hash: string
	file: File
}

export interface FileTransferEntryHeader {
	publicName: string
	sha512hash: string
	size: number
}

export const fileTransferHeaderFromFileTransferEntry = (
	entry: FileTransferEntry
): FileTransferEntryHeader => ({
	publicName: entry.publicName,
	sha512hash: entry.sha512hash,
	size: entry.file.size,
})

export enum ReceiverStageFileTransfer {
	PICK_TARGET = 1,
	EXCHANGE_CODE = 2,
	SHOW_SUMMARY = 3,
	PERFORM_RECEIVING = 4,
}

export interface FileTransferPeerData {
	peer: Peer
	dataConnections: DataConnection
}

export const MAGIC_ACCEPT_FILES = "MAGIC_ACCEPT_FILE"
export const MAGIC_END_OF_FILES = "MAGIC_END_OF_FILES"
export const MAGIC_DID_RECEIVE = "MAGIC_DID_RECEIVE"
export const MAGIC_AUTH_SUCCESS = "MAGIC_AUTH_SUCCESS"

export type FileTransferTokenData = {
	peerId: string
	authId: string
}

export const encodeFileTransferTokenData = (
	data: FileTransferTokenData
): string => {
	const { authId, peerId } = data
	return JSON.stringify({
		authId,
		peerId,
	})
}

export const decodeFileTransferTokenData = (
	token: string
): FileTransferTokenData => {
	try {
		const res = JSON.parse(token)
		if (typeof res !== "object" || res instanceof Array)
			throw new Error("Invalid token data type")
		const { authId, peerId } = res

		if (typeof authId !== "string" || typeof peerId !== "string")
			throw new Error("Invalid auth id provided")

		return {
			authId,
			peerId,
		}
	} catch (e) {
		throw new Error(`Filed to decode token: ${token}`)
	}
}

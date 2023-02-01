import { DataConnection, IDataConnection, Peer } from "@teawithsand/tws-peer"

export type FileTransferConn = IDataConnection

export enum FileTransferVersion {
	V1 = 1,
}

export type FileTransferHello = {
	version: FileTransferVersion
}

export enum FileTransferAuthType {
	REQUEST = 1,
	PROVIDE = 2,
}

export const isFileTransferAuthNameValid = (name: string) => {
	if (name.length < 3) return false
	if (name.length > 64) return false

	// Valid char list
	if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false

	// Can't start or end with _ or -
	if (/^[_-]+/.test(name)) return false
	if (/[_-]+$/.test(name)) return false

	return true
}

export type FileTransferAuthResult = {
	remotePartyName: string
}

export type FileTransferAuth = (
	| {
			type: FileTransferAuthType.PROVIDE
			authSecret: string
	  }
	| {
			type: FileTransferAuthType.REQUEST
			authSecret: string
	  }
) & {
	/**
	 * Name to send to remote party.
	 */
	name: string
}

export interface FileTransferEntry {
	publicName: string
	file: File
}

export interface FileTransferEntryHeader {
	publicName: string
	size: number
}

export const fileTransferHeaderFromFileTransferEntry = (
	entry: FileTransferEntry
): FileTransferEntryHeader => ({
	publicName: entry.publicName,
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
export const MAGIC_AUTH_INIT = "MAGIC_AUTH_INIT"

export type FileTransferTokenData = {
	peerId: string
	authId: string
}

export const encodeFileTransferTokenData = (
	data: FileTransferTokenData
): string => {
	const { authId, peerId } = data
	return btoa(
		JSON.stringify({
			authId,
			peerId,
		})
	).replace(/[=]*/g, "")
}

export const decodeFileTransferTokenData = (
	token: string
): FileTransferTokenData => {
	try {
		token = atob(token)
		if (typeof token !== "string")
			throw new Error("Invalid base64 string provided")
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

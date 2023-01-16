import { DataConnection, Peer } from "@teawithsand/tws-peer"

export enum FileTransferAuthType {
	REQUEST = 1,
	PROVIDE = 2,
}

export type FileTransferAuth = {
	type: FileTransferAuthType.PROVIDE,
	authSecret: string
} | {
	type: FileTransferAuthType.REQUEST,
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

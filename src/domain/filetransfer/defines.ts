import { DataConnection, Peer } from "@teawithsand/tws-peer"

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

export enum SenderStageFileTransfer {
	PICK_FILES = 1,
	EXCHANGE_CODE = 2,
	PERFORM_SENDING = 3,
}

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

import {
	FileTransferEntryHeader,
	MAGIC_ACCEPT_FILES,
	MAGIC_DID_RECEIVE,
} from "@app/domain/filetransfer/defines"
import { Peer, runPeerDataConnectionRunner } from "@teawithsand/tws-peer"

export interface FileReceiveProgressData {
	totalCount: number
	fileIndex: number
}

export interface FileReceiverCallbacks {
	onFileReceiveProgress: (
		progress: FileReceiveProgressData,
		header: FileTransferEntryHeader,
		blob: Blob
	) => Promise<void>

	onFileReceive: (
		progress: FileReceiveProgressData,
		header: FileTransferEntryHeader,
		file: File
	) => Promise<void>

	onHeadersReceive: (headers: FileTransferEntryHeader[]) => Promise<void>
}

export class FileReceiveHelper {
	constructor(private readonly peer: Peer) {}

	receive = async (
		remotePeerId: string,
		authId: string,
		callbacks: FileReceiverCallbacks
	) => {
		const conn = this.peer.connect(remotePeerId)
		await runPeerDataConnectionRunner(
			this.peer,
			conn,
			async (_peer, conn, _state, receiver) => {
				conn.send(authId)

				const headers: FileTransferEntryHeader[] =
					await receiver.receiveData()
				// TODO(teawithsand): validate structure of received data via joi or something else
				await callbacks.onHeadersReceive(headers)

				conn.send(MAGIC_ACCEPT_FILES)

				const progressData: FileReceiveProgressData = {
					fileIndex: 0,
					totalCount: headers.length,
				}

				for (const header of headers) {
					// TODO(teawithsand): check received header against header provided
					const receivedHeader: FileTransferEntryHeader =
						await receiver.receiveData()

					let resultBlob = new Blob([])

					let bytesLeft = receivedHeader.size

					await callbacks.onFileReceiveProgress(
						{ ...progressData },
						header,
						resultBlob
					)

					for (;;) {
						if (bytesLeft === 0) break

						const chunk = await receiver.receiveData()
						if (!(chunk instanceof ArrayBuffer)) {
							throw new Error("bad type")
						}

						bytesLeft -= chunk.byteLength
						if (bytesLeft < 0)
							throw new Error("chunk size mismatch")
						resultBlob = new Blob([resultBlob, chunk])
						await callbacks.onFileReceiveProgress(
							{ ...progressData },
							header,
							resultBlob
						)

						conn.send(MAGIC_DID_RECEIVE)
					}

					// TODO(teawithsand): check sha512hash of result here

					await callbacks.onFileReceive(
						{ ...progressData },
						header,
						new File([resultBlob], header.publicName)
					)

					progressData.fileIndex++
				}

				await receiver.receiveData()
			}
		)
	}
}

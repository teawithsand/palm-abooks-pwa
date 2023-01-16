import {
	FileTransferEntry,
	MAGIC_ACCEPT_FILES,
	MAGIC_DID_RECEIVE,
	MAGIC_END_OF_FILES,
	fileTransferHeaderFromFileTransferEntry,
} from "@app/domain/filetransfer/defines"
import { Queue } from "@app/util/queue"
import {
	Peer,
	generateSecureClientId,
	runPeerDataConnectionRunner,
	runPeerRunner,
} from "@teawithsand/tws-peer"
import { latePromise } from "@teawithsand/tws-stl"

class MiniSemaphore {
	private pass = false
	private awaitersQueue: Queue<() => void> = new Queue()

	setPass = (pass: boolean) => {
		if (pass) {
			this.pass = true

			for (;;) {
				const v = this.awaitersQueue.pop()
				if (!v) break

				v()
			}
		}
	}

	promise = (): Promise<void> => {
		if (this.pass) return Promise.resolve()
		const [p, resolve] = latePromise<void>()
		this.awaitersQueue.push(resolve)

		return p
	}
}

export class FileSendHelper {
	private authId = generateSecureClientId()

	private acceptNewConn = false
	private connHoldSemaphore = new MiniSemaphore()

	private entries: FileTransferEntry[] = []

	setEntries = (entries: FileTransferEntry[]) => {
		this.entries = entries
	}

	setAcceptNewConn = (allow: boolean) => {
		this.acceptNewConn = allow
	}

	setHoldNewConn = (hold: boolean) => {
		this.connHoldSemaphore.setPass(!hold)
	}

	constructor(peer: Peer) {
		runPeerRunner(peer, async (_peer, _state, receiver) => {
			for (;;) {
				const conn = await receiver.receiveDataConn()
				// do not await!
				runPeerDataConnectionRunner( 
					peer,
					conn,
					async (_peer, conn, state, receiver) => {
						if (!this.acceptNewConn) return

						const data = await receiver.receiveData()
						if (typeof data !== "string" || data !== this.authId)
							return // kill such connection

						await this.connHoldSemaphore.promise()

						// This has to be above semaphore, so changes made before doing allow are reflected in code.;
						const entries = this.entries
						conn.send(
							entries.map((e) =>
								fileTransferHeaderFromFileTransferEntry(e)
							)
						)

						const ack = await receiver.receiveData()
						if (ack !== MAGIC_ACCEPT_FILES) return

						for (const entry of entries) {
							if (state.isClosed || state.error) return
							const { file } = entry

							conn.send(
								fileTransferHeaderFromFileTransferEntry(entry)
							)

							let ptr = 0
							const CHUNK_SIZE = 64 * 1024

							for (;;) {
								const chunk = file.slice(ptr, ptr + CHUNK_SIZE)
								if (chunk.size === 0) break
								ptr += chunk.size

								const arrayBuffer = await chunk.arrayBuffer()
								conn.send(arrayBuffer)

								const res = await receiver.receiveData()
								if (res !== MAGIC_DID_RECEIVE) {
									return
								}
							}
						}

						conn.send(MAGIC_END_OF_FILES)
					}
				)
			}
		})
	}
}

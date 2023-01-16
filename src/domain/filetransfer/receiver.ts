import {
	FileTransferAuth,
	FileTransferAuthType,
	FileTransferEntryHeader,
	MAGIC_ACCEPT_FILES,
	MAGIC_AUTH_SUCCESS,
	MAGIC_DID_RECEIVE,
} from "@app/domain/filetransfer/defines"
import {
	DataConnection,
	Peer,
	runPeerDataConnectionRunner,
	runPeerRunner,
} from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	generateUUID,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export type FileReceiverConfig = {
	auth: FileTransferAuth

	/**
	 * Function responsible for checking headers whether or not are worth receiving.
	 *
	 * It should throw if they are not worth receiving.
	 *
	 * This function is omitted and data is always accepted, if it's not set.
	 */
	checkEntriesHeaders?: (entries: FileTransferEntryHeader[]) => Promise<void>
}

export enum FileReceiverTransferState {
	CONNECTED = 1,
	AUTHENTICATED = 2,
	RECEIVED_HEADER = 3,
	RECEIVING_FILES = 4,
	DONE = 5,
}

export type FileTransferReceivedEntry = {
	header: FileTransferEntryHeader
	result: File | Blob | null
	isDoneSuccess: boolean
}

export type FileReceiverTransfer = {
	id: string

	peer: Peer
	conn: DataConnection

	state: FileReceiverTransferState

	entries: FileTransferReceivedEntry[] | null

	currentEntryIndex: number
	doneCount: number
	currentEntryFraction: number

	isClosed: boolean
	error: Error | null

	close: () => void
}

export type FileReceiverState = {
	config: FileReceiverConfig
	transfers: {
		[id: string]: FileReceiverTransfer
	}
}

export class FileReceiver {
	private readonly innerStateBus =
		new DefaultStickyEventBus<FileReceiverState>({
			config: {
				auth: {
					type: FileTransferAuthType.PROVIDE,
					authSecret: "",
				},
			},

			transfers: {},
		})

	get stateBus(): StickySubscribable<FileReceiverState> {
		return this.innerStateBus
	}

	private innerHandleConn = async (peer: Peer, conn: DataConnection) => {
		await runPeerDataConnectionRunner(
			peer,
			conn,
			async (_peer, conn, state, receiver) => {
				const config = this.innerStateBus.lastEvent.config

				const id = generateUUID()
				let transfer: FileReceiverTransfer = {
					state: FileReceiverTransferState.CONNECTED,
					id,
					peer,
					conn,

					entries: null,

					currentEntryFraction: 0,
					currentEntryIndex: -1,
					doneCount: 0,

					error: null,
					isClosed: false,

					close: () => {
						conn.close()
						updateTransfer((draft) => (draft.isClosed = true))
					},
				}

				const updateTransfer = (
					cb: (draft: Draft<FileReceiverTransfer>) => void
				) => {
					transfer = produce(transfer, cb)
					this.updateState(
						(draft) => (draft.transfers[id] = transfer)
					)
				}

				updateTransfer(() => {})

				let caughtError: Error | null = null
				try {
					if (config.auth.type === FileTransferAuthType.PROVIDE) {
						conn.send(config.auth.authSecret)

						await receiver.receiveData()
					} else {
						const secret = await receiver.receiveData()
						if (
							typeof secret !== "string" ||
							secret !== config.auth.authSecret
						)
							throw new Error("Invalid auth string")

						conn.send(MAGIC_AUTH_SUCCESS)
					}

					updateTransfer((draft) => {
						draft.state = FileReceiverTransferState.AUTHENTICATED
					})

					// TODO(teawithsand): validate structure of received data via joi or something else
					const headers: FileTransferEntryHeader[] =
						await receiver.receiveData()

					updateTransfer((draft) => {
						draft.entries = headers.map((v) => ({
							header: v,
							isDoneSuccess: false,
							result: null,
						}))
						draft.state = FileReceiverTransferState.RECEIVED_HEADER
					})

					if (config.checkEntriesHeaders)
						await config.checkEntriesHeaders(headers)

					conn.send(MAGIC_ACCEPT_FILES)

					updateTransfer((draft) => {
						draft.state = FileReceiverTransferState.RECEIVING_FILES
						draft.currentEntryIndex = 0
					})

					for (const header of headers) {
						// TODO(teawithsand): check received header against header provided
						const receivedHeader: FileTransferEntryHeader =
							await receiver.receiveData()

						let resultBlob = new Blob([])

						let bytesLeft = receivedHeader.size

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

							conn.send(MAGIC_DID_RECEIVE)

							// TODO(teawithsand): check sha512hash of result here

							updateTransfer((draft) => {
								if (
									draft.currentEntryIndex + 1 >=
									(draft.entries?.length ?? 0)
								) {
									draft.currentEntryIndex = -1
								} else {
									draft.currentEntryIndex++
									draft.doneCount++
									draft.currentEntryFraction = 0
								}
							})
						}
					}

					updateTransfer((draft) => {
						draft.state = FileReceiverTransferState.DONE
					})
				} catch (e) {
					caughtError = e
				} finally {
					updateTransfer((draft) => {
						draft.error =
							(caughtError instanceof Error
								? caughtError
								: null) ??
							state.error ??
							null
						draft.isClosed = true
					})
				}
			}
		)
	}

	/**
	 * Use peer.destroy to interrupt it.
	 *
	 * It takes ownership of peer it's given. For non-owning receiving use handleConn instead.
	 */
	listenOnPeer = async (peer: Peer) => {
		await runPeerRunner(peer, async (peer, _state, receiver) => {
			for (;;) {
				const conn = await receiver.receiveDataConn()
				this.handleConn(peer, conn)
			}
		})
	}

	/**
	 * Handles connection for file sending. It does not matter if connection is outgoing
	 * or incoming one.
	 *
	 * It takes ownership if connection it's given.
	 */
	handleConn = async (peer: Peer, conn: DataConnection) => {
		await this.innerHandleConn(peer, conn).catch(() => {
			// Error should be handled by runner until that moment
		})
	}

	private updateState = (cb: (draft: Draft<FileReceiverState>) => void) => {
		this.innerStateBus.emitEvent(produce(this.innerStateBus.lastEvent, cb))
	}

	public setConfig = (config: FileReceiverConfig) =>
		this.updateState((draft) => {
			draft.config = config
		})

	public updateConfig = (cb: (draft: Draft<FileReceiverConfig>) => void) => {
		this.innerStateBus.emitEvent(
			produce(this.innerStateBus.lastEvent, (draft) => {
				cb(draft.config)
			})
		)
	}
}

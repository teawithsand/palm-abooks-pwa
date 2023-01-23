import {
	FileTransferAuth,
	FileTransferAuthType,
	FileTransferEntry,
	MAGIC_ACCEPT_FILES,
	MAGIC_AUTH_SUCCESS,
	MAGIC_DID_RECEIVE,
	MAGIC_END_OF_FILES,
	fileTransferHeaderFromFileTransferEntry,
} from "@app/domain/filetransfer/defines"
import {
	DataConnection,
	Peer,
	generateSecureClientId,
	runPeerDataConnectionRunner,
	runPeerRunner,
} from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	generateUUID,
} from "@teawithsand/tws-stl"
import produce, { Draft } from "immer"

export type FileSenderConfig = {
	auth: FileTransferAuth

	entries: FileTransferEntry[]

	// Helper flag, which simplifies rejecting new connections.
	acceptConnections: boolean
}

export enum FileSenderTransferState {
	CONNECTED = 1,
	AUTHENTICATED = 2,
	SENDING_FILES = 3,
	DONE = 4,
}

export type FileSenderTransfer = {
	id: string

	state: FileSenderTransferState
	conn: DataConnection

	entries: FileTransferEntry[]

	doneCount: number
	currentEntryIndex: number
	currentEntryFraction: number

	totalFraction: number

	error: Error | null
	isClosed: boolean

	close: () => void
}

export type FileSenderState = {
	config: FileSenderConfig

	transfers: {
		[key: string]: FileSenderTransfer
	}
}

export class FileSender {
	private readonly innerStateBus = new DefaultStickyEventBus<FileSenderState>(
		{
			config: {
				auth: {
					type: FileTransferAuthType.REQUEST,
					authSecret: generateSecureClientId(),
				},
				entries: [],
				acceptConnections: false,
			},

			transfers: {},
		}
	)

	get stateBus(): StickySubscribable<FileSenderState> {
		return this.innerStateBus
	}

	private innerHandleConn = async (peer: Peer, conn: DataConnection) => {
		const config = this.innerStateBus.lastEvent.config
		if (!config.acceptConnections) {
			return // if we are not accepting, then just silently exit procedure of handling new conn
		}

		const id = generateUUID()

		let transfer: FileSenderTransfer = {
			state: FileSenderTransferState.CONNECTED,
			id,
			conn,
			totalFraction: 0,
			currentEntryFraction: 0,
			currentEntryIndex: -1,
			doneCount: 0,
			entries: config.entries,
			error: null,
			isClosed: false,

			close: () => {
				conn.close()
				updateTransfer((draft) => (draft.isClosed = true))
			},
		}

		const updateTransfer = (
			cb: (draft: Draft<FileSenderTransfer>) => void
		) => {
			transfer = produce(transfer, cb)
			this.updateState((draft) => (draft.transfers[id] = transfer))
		}

		updateTransfer(() => {})

		try {
			await runPeerDataConnectionRunner(
				peer,
				conn,
				async (_peer, conn, state, receiver) => {
					let caughtError: any | null = null
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
							draft.state = FileSenderTransferState.AUTHENTICATED
						})

						updateTransfer((draft) => {
							draft.state = FileSenderTransferState.SENDING_FILES
							draft.currentEntryIndex = 0
						})

						// This has to be above semaphore, so changes made before doing allow are reflected in code.;
						const entries = config.entries
						conn.send(
							entries.map((e) =>
								fileTransferHeaderFromFileTransferEntry(e)
							)
						)

						const ack = await receiver.receiveData()
						if (ack !== MAGIC_ACCEPT_FILES) {
							throw new Error("Invalid magic received")
						}

						const totalSize = entries.length
							? entries
									.map((v) => v.file.size)
									.reduce((a, b) => a + b)
							: 0

						let sentSize = 0
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
								sentSize += arrayBuffer.byteLength
								conn.send(arrayBuffer)

								const res = await receiver.receiveData()
								if (res !== MAGIC_DID_RECEIVE) {
									throw new Error("Invalid magic received")
								}

								updateTransfer((draft) => {
									draft.currentEntryFraction = ptr / file.size
									draft.totalFraction = sentSize / totalSize
								})
							}

							updateTransfer((draft) => {
								if (
									draft.currentEntryIndex + 1 >=
									draft.entries.length
								) {
									draft.currentEntryIndex = -1
								} else {
									draft.currentEntryIndex++
									draft.doneCount++
									draft.currentEntryFraction = 0
								}
							})
						}

						conn.send(MAGIC_END_OF_FILES)
						updateTransfer(
							(draft) =>
								(draft.state = FileSenderTransferState.DONE)
						)
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
		} finally {
			this.updateState((draft) => {
				delete draft.transfers[id]
			})
		}
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

	public setConfig = (config: FileSenderConfig) =>
		this.updateState((draft) => {
			draft.config = config
		})

	public updateConfig = (cb: (draft: Draft<FileSenderConfig>) => void) => {
		this.innerStateBus.emitEvent(
			produce(this.innerStateBus.lastEvent, (draft) => {
				cb(draft.config)
			})
		)
	}

	private updateState = (cb: (draft: Draft<FileSenderState>) => void) => {
		this.innerStateBus.emitEvent(produce(this.innerStateBus.lastEvent, cb))
	}
}

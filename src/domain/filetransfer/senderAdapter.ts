import {
	FileTransferAuth,
	FileTransferAuthType,
	FileTransferConn,
	FileTransferEntry,
	MAGIC_ACCEPT_FILES,
	MAGIC_AUTH_SUCCESS,
	MAGIC_DID_RECEIVE,
	MAGIC_END_OF_FILES,
	fileTransferHeaderFromFileTransferEntry,
} from "@app/domain/filetransfer/defines"

import {
	ConnRegistryAdapter,
	ConnRegistryAdapterHandle,
} from "@teawithsand/tws-peer"
import { BusAwaiter } from "@teawithsand/tws-stl"
import produce from "immer"

export enum SenderAdapterConnStatus {
	CONNECTED = 1,
	AUTHENTICATED_HEADERS_SENT = 2,
	SENDING_FILES = 3,
	DONE = 4,
}

export type SenderAdapterInitData = {
	auth: FileTransferAuth
	entries: FileTransferEntry[]
}

export type SenderAdapterConnState = {
	status: SenderAdapterConnStatus

	doneCount: number
	currentEntryIndex: number
	currentEntryFraction: number

	totalFraction: number
}

export enum SenderAdapterConnStage {
	WAIT = 1,
	AUTHENTICATE_SEND_HEADERS = 2,
	SEND_ENTRIES = 3,
	CLOSE = 4,
}

export type SenderConnConfig = {
	stage: SenderAdapterConnStage
}

export class SenderConnAdapter
	implements
		ConnRegistryAdapter<
			FileTransferConn,
			SenderAdapterConnState,
			SenderConnConfig,
			SenderAdapterInitData
		>
{
	makeInitialConfig = (
		conn: FileTransferConn,
		initData: SenderAdapterInitData,
		id: string
	) => ({
		stage: SenderAdapterConnStage.WAIT,
	})

	makeInitialState = (
		conn: FileTransferConn,
		config: SenderConnConfig,
		initData: SenderAdapterInitData,
		id: string
	): SenderAdapterConnState => ({
		status: SenderAdapterConnStatus.CONNECTED,
		currentEntryFraction: 0,
		currentEntryIndex: -1,
		doneCount: 0,
		totalFraction: 0,
	})

	handle = async (
		handle: ConnRegistryAdapterHandle<
			FileTransferConn,
			SenderAdapterConnState,
			SenderConnConfig,
			SenderAdapterInitData
		>
	) => {
		const { conn, updateState, connConfigBus, initData } = handle

		let isAuthenticated = false
		let isClosedByUser = false
		let isSentFiles = false

		const configAwaiter = new BusAwaiter(connConfigBus)

		connConfigBus.addSubscriber((config) => {
			if (config.stage === SenderAdapterConnStage.CLOSE) {
				isClosedByUser = true
				conn.close()
			}
		})

		// These two must be provided during initialization
		const { auth, entries } = initData

		const doAuth = async () => {
			isAuthenticated = true

			if (auth.type === FileTransferAuthType.PROVIDE) {
				conn.send(auth.authSecret)

				await conn.messageQueue.receive() // receive magic
			} else {
				const secret = await conn.messageQueue.receive()
				if (typeof secret !== "string" || secret !== auth.authSecret)
					throw new Error("Invalid auth string")

				conn.send(MAGIC_AUTH_SUCCESS)
			}

			conn.send(
				entries.map((e) => fileTransferHeaderFromFileTransferEntry(e))
			)

			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status =
						SenderAdapterConnStatus.AUTHENTICATED_HEADERS_SENT
				})
			)
		}

		const doSend = async () => {
			isSentFiles = true
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = SenderAdapterConnStatus.SENDING_FILES
				})
			)

			const ack = await conn.messageQueue.receive()
			if (ack !== MAGIC_ACCEPT_FILES) {
				throw new Error("Invalid magic received")
			}

			const totalSize = entries.length
				? entries.map((v) => v.file.size).reduce((a, b) => a + b)
				: 0

			let sentSize = 0
			for (const entry of entries) {
				if (isClosedByUser)
					throw new Error("Sending interrupted by user")

				const { file } = entry

				conn.send(fileTransferHeaderFromFileTransferEntry(entry))

				let ptr = 0
				const CHUNK_SIZE = 64 * 1024

				for (;;) {
					if (isClosedByUser)
						throw new Error("Sending interrupted by user")

					const chunk = file.slice(ptr, ptr + CHUNK_SIZE)
					if (chunk.size === 0) break
					ptr += chunk.size

					const arrayBuffer = await chunk.arrayBuffer()
					sentSize += arrayBuffer.byteLength
					conn.send(arrayBuffer)

					const res = await conn.messageQueue.receive()
					if (res !== MAGIC_DID_RECEIVE) {
						throw new Error("Invalid magic received")
					}

					updateState((oldState) =>
						produce(oldState, (draft) => {
							draft.currentEntryFraction = ptr / file.size
							draft.totalFraction = sentSize / totalSize
						})
					)
				}

				updateState((oldState) =>
					produce(oldState, (draft) => {
						if (draft.currentEntryIndex + 1 >= entries.length) {
							draft.currentEntryIndex = -1
						} else {
							draft.currentEntryIndex++
							draft.doneCount++
							draft.currentEntryFraction = 0
						}
					})
				)
			}

			conn.send(MAGIC_END_OF_FILES)
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = SenderAdapterConnStatus.DONE
				})
			)
		}

		try {
			for (;;) {
				if (isClosedByUser) break

				const config = await configAwaiter.readEvent()
				if (config.stage === SenderAdapterConnStage.WAIT) {
					continue
				} else if (
					config.stage ===
					SenderAdapterConnStage.AUTHENTICATE_SEND_HEADERS
				) {
					if (isAuthenticated || isSentFiles) continue

					await doAuth()
				} else if (
					config.stage === SenderAdapterConnStage.SEND_ENTRIES
				) {
					if (isSentFiles || isAuthenticated) continue
					if (!isAuthenticated) await doAuth()

					await doSend()
					break // exit after send was done
				} else if (config.stage === SenderAdapterConnStage.CLOSE) {
					break
				}
			}
		} finally {
			configAwaiter.close()
			conn.close()
		}
	}

	cleanup = async (
		handle: ConnRegistryAdapterHandle<
			FileTransferConn,
			SenderAdapterConnState,
			SenderConnConfig,
			SenderAdapterInitData
		>
	) => {
		handle.conn.close()
	}
}

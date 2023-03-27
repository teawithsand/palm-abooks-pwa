import { FileTransferHelper } from "@app/domain/filetransfer/adapterCommon"
import {
	FileTransferAuth,
	FileTransferAuthResult,
	FileTransferConn,
	FileTransferEntry,
	MAGIC_ACCEPT_FILES,
	MAGIC_DID_RECEIVE,
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
	untypedHeader?: any
}

export type SenderAdapterConnState = {
	status: SenderAdapterConnStatus

	authResult: FileTransferAuthResult | null

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
	modifyConfigOnRemove = (config: SenderConnConfig) =>
		produce(config, (draft) => {
			draft.stage = SenderAdapterConnStage.CLOSE
		})

	makeInitialConfig = () => ({
		stage: SenderAdapterConnStage.WAIT,
	})

	makeInitialState = (): SenderAdapterConnState => ({
		status: SenderAdapterConnStatus.CONNECTED,
		authResult: null,
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

		const helper = new FileTransferHelper(conn)

		const doAuth = async () => {
			isAuthenticated = true
			await helper.exchangeHello()
			const res = await helper.doAuthenticate(auth)

			const headers = entries.map((e) =>
				fileTransferHeaderFromFileTransferEntry(e)
			)
			conn.send(headers)
			conn.send(initData.untypedHeader ?? "") // can't send null or undefined, so send empty string instead

			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status =
						SenderAdapterConnStatus.AUTHENTICATED_HEADERS_SENT
					draft.authResult = res
				})
			)
		}

		const doSend = async () => {
			if (!isAuthenticated)
				throw new Error("Unreachable code: not authenticated yet")

			isSentFiles = true
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = SenderAdapterConnStatus.SENDING_FILES
				})
			)

			await helper.receiveMagic(MAGIC_ACCEPT_FILES)

			const totalSize = entries.length
				? entries.map((v) => v.file.size).reduce((a, b) => a + b)
				: 0

			let sentSize = 0
			for (const entry of entries) {
				if (isClosedByUser)
					throw new Error("Sending interrupted by user")

				const { file, untypedHeader } = entry

				let ptr = 0
				const CHUNK_SIZE = 32 * 1024

				conn.send(untypedHeader ?? "") // can't send null or undefined, so send empty string instead

				for (;;) {
					if (isClosedByUser)
						throw new Error("Sending interrupted by user")

					const chunk = file.slice(ptr, ptr + CHUNK_SIZE)
					if (chunk.size === 0) break
					ptr += chunk.size

					const arrayBuffer = await chunk.arrayBuffer()
					sentSize += arrayBuffer.byteLength
					conn.send(arrayBuffer)

					await helper.receiveMagic(MAGIC_DID_RECEIVE)

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

			try {
				await helper.exchangeDone()
			} catch (e) {
				// pass; ignore errors in closing exchange
			}

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
					if (isAuthenticated) continue

					await doAuth()
				} else if (
					config.stage === SenderAdapterConnStage.SEND_ENTRIES
				) {
					if (isSentFiles) continue
					if (!isAuthenticated) await doAuth()

					await doSend()
					break // exit after send was done
				} else if (config.stage === SenderAdapterConnStage.CLOSE) {
					break
				}
			}
		} catch (e) {
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = SenderAdapterConnStatus.DONE
				})
			)

			console.error("Error while sending files", e)
			throw e
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

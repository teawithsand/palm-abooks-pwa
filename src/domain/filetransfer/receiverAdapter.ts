import { FileTransferHelper } from "@app/domain/filetransfer/adapterCommon"
import {
	FileTransferAuth,
	FileTransferAuthResult,
	FileTransferConn,
	FileTransferEntry,
	FileTransferEntryHeader,
	MAGIC_ACCEPT_FILES,
	MAGIC_DID_RECEIVE,
} from "@app/domain/filetransfer/defines"

import {
	ConnRegistryAdapter,
	ConnRegistryAdapterHandle,
} from "@teawithsand/tws-peer"
import { BusAwaiter } from "@teawithsand/tws-stl"
import produce from "immer"

export enum ReceiverAdapterConnStatus {
	CONNECTED = 1,
	AUTHENTICATED = 2,
	RECEIVED_HEADERS = 3,
	RECEIVING_FILES = 4,
	DONE = 5,
}

export type ReceiverAdapterInitData = {
	auth: FileTransferAuth
}

export type ReceiverAdapterConnState = {
	status: ReceiverAdapterConnStatus

	authResult: FileTransferAuthResult | null
	untypedHeaders: any | null
	headers: FileTransferEntryHeader[]

	currentEntryDoneFraction: number
	totalDoneFraction: number
	doneEntries: FileTransferEntry[]
}

export enum ReceiverAdapterConnStage {
	WAIT = 1,
	AUTHENTICATE_RECEIVE_HEADER = 2,
	RECEIVE_FILES = 3,
	CLOSE = 4,
}

export type ReceiverAdapterConnConfig = {
	stage: ReceiverAdapterConnStage
}

export class ReceiverConnAdapter
	implements
		ConnRegistryAdapter<
			FileTransferConn,
			ReceiverAdapterConnState,
			ReceiverAdapterConnConfig,
			ReceiverAdapterInitData
		>
{
	modifyConfigOnRemove = (config: ReceiverAdapterConnConfig) =>
		produce(config, (draft) => {
			draft.stage = ReceiverAdapterConnStage.CLOSE
		})

	makeInitialConfig = () => ({
		stage: ReceiverAdapterConnStage.WAIT,
	})

	makeInitialState = (): ReceiverAdapterConnState => ({
		status: ReceiverAdapterConnStatus.CONNECTED,
		authResult: null,
		currentEntryDoneFraction: 0,
		doneEntries: [],
		headers: [],
		totalDoneFraction: 0,
		untypedHeaders: null,
	})

	handle = async (
		handle: ConnRegistryAdapterHandle<
			FileTransferConn,
			ReceiverAdapterConnState,
			ReceiverAdapterConnConfig,
			ReceiverAdapterInitData
		>
	) => {
		const { conn, updateState, connConfigBus, initData } = handle
		const configAwaiter = new BusAwaiter(connConfigBus)

		let isAuthenticatedAndReceivedHeaders = false
		let isClosedByUser = false
		let isReceiveFiles = false

		let headers: FileTransferEntryHeader[] = []

		connConfigBus.addSubscriber((config) => {
			if (config.stage === ReceiverAdapterConnStage.CLOSE) {
				isClosedByUser = true
				conn.close()
			}
		})

		// These two must be provided during initialization
		const { auth } = initData

		const helper = new FileTransferHelper(conn)

		const doAuthAndReceiveHeaders = async () => {
			isAuthenticatedAndReceivedHeaders = true
			await helper.exchangeHello()
			const res = await helper.doAuthenticate(auth)

			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = ReceiverAdapterConnStatus.AUTHENTICATED
					draft.authResult = res
				})
			)

			// TODO(teawithsand): validate structure of received data via joi or something else
			// not only structure should match, but size should be int greater than 0 and less than say 2 or 4GB
			headers = await conn.messageQueue.receive()
			// clean any prototypes, if such were added due to some bug
			const untypedHeaders = JSON.parse(
				JSON.stringify(await conn.messageQueue.receive())
			)

			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = ReceiverAdapterConnStatus.RECEIVED_HEADERS
					draft.headers = headers
					draft.untypedHeaders = untypedHeaders
				})
			)
		}

		const doReceive = async () => {
			if (!isAuthenticatedAndReceivedHeaders)
				throw new Error("Unreachable code: not authenticated yet")

			isReceiveFiles = true
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = ReceiverAdapterConnStatus.RECEIVING_FILES
				})
			)

			conn.send(MAGIC_ACCEPT_FILES)

			const totalSize = headers.length
				? headers.map((v) => v.size).reduce((a, b) => a + b)
				: 0
			let totalReceived = 0

			for (const header of headers) {
				let resultBlob = new Blob([])
				let bytesLeft = header.size

				const untypedFileHeader = await conn.messageQueue.receive()

				for (;;) {
					if (bytesLeft === 0) break

					const chunk = await conn.messageQueue.receive()
					if (!(chunk instanceof ArrayBuffer)) {
						throw new Error("bad type")
					}

					bytesLeft -= chunk.byteLength
					totalReceived += chunk.byteLength
					if (bytesLeft < 0) throw new Error("chunk size mismatch")
					resultBlob = new Blob([resultBlob, chunk])

					conn.send(MAGIC_DID_RECEIVE)

					updateState((oldState) =>
						produce(oldState, (draft) => {
							draft.currentEntryDoneFraction =
								resultBlob.size / header.size
							draft.totalDoneFraction = totalReceived / totalSize
						})
					)
				}

				updateState((oldState) =>
					produce(oldState, (draft) => {
						draft.currentEntryDoneFraction = 0
						draft.totalDoneFraction = totalSize / totalReceived
						draft.doneEntries.push({
							file: new File([resultBlob], header.publicName),
							publicName: header.publicName,
							untypedHeader: untypedFileHeader,
						})
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
					draft.status = ReceiverAdapterConnStatus.DONE
					draft.totalDoneFraction = 1
					draft.currentEntryDoneFraction = 0
				})
			)
		}

		try {
			for (;;) {
				if (isClosedByUser) break

				const config = await configAwaiter.readEvent()
				if (config.stage === ReceiverAdapterConnStage.WAIT) {
					continue
				} else if (
					config.stage ===
					ReceiverAdapterConnStage.AUTHENTICATE_RECEIVE_HEADER
				) {
					if (isAuthenticatedAndReceivedHeaders) continue

					await doAuthAndReceiveHeaders()
				} else if (
					config.stage === ReceiverAdapterConnStage.RECEIVE_FILES
				) {
					if (isReceiveFiles) continue
					if (!isAuthenticatedAndReceivedHeaders)
						await doAuthAndReceiveHeaders()

					await doReceive()
					break // exit after send was done
				} else if (config.stage === ReceiverAdapterConnStage.CLOSE) {
					break
				}
			}
		} catch (e) {
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = ReceiverAdapterConnStatus.DONE
					draft.totalDoneFraction = 1
					draft.currentEntryDoneFraction = 0
				})
			)

			console.error("Error while receiving", e)
			throw e
		} finally {
			configAwaiter.close()
			conn.close()
		}
	}

	cleanup = async (
		handle: ConnRegistryAdapterHandle<
			FileTransferConn,
			ReceiverAdapterConnState,
			ReceiverAdapterConnConfig,
			ReceiverAdapterInitData
		>
	) => {
		handle.conn.close()
	}
}

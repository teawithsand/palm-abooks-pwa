import {
	FileTransferAuth,
	FileTransferAuthType,
	FileTransferConn,
	FileTransferEntry,
	FileTransferEntryHeader,
	MAGIC_ACCEPT_FILES,
	MAGIC_AUTH_SUCCESS,
	MAGIC_DID_RECEIVE,
	MAGIC_END_OF_FILES,
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
		currentEntryDoneFraction: 0,
		doneEntries: [],
		headers: [],
		totalDoneFraction: 0,
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

		const receiveMagic = async (magic: string) => {
			const res = await conn.messageQueue.receive()
			if (res !== magic) {
				throw new Error(
					`Magic receive filed. Wanted ${magic} got ${res}`
				)
			}
		}

		const doAuthAndReceiveHeaders = async () => {
			isAuthenticatedAndReceivedHeaders = true

			if (auth.type === FileTransferAuthType.PROVIDE) {
				conn.send(auth.authSecret)

				await receiveMagic(MAGIC_AUTH_SUCCESS)
			} else {
				const secret = await conn.messageQueue.receive()
				if (typeof secret !== "string" || secret !== auth.authSecret)
					throw new Error("Invalid auth string")

				conn.send(MAGIC_AUTH_SUCCESS)
			}

			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = ReceiverAdapterConnStatus.AUTHENTICATED
				})
			)

			// TODO(teawithsand): validate structure of received data via joi or something else
			// not only structure should match, but size should be int greater than 0 and less than say 2 or 4GB
			headers = await conn.messageQueue.receive()
			console.log("Received headers", headers)
			updateState((oldState) =>
				produce(oldState, (draft) => {
					draft.status = ReceiverAdapterConnStatus.RECEIVED_HEADERS
					draft.headers = headers
				})
			)
		}

		const doReceive = async () => {
			if (!isAuthenticatedAndReceivedHeaders)
				throw new Error("Unreachable code: not authenticated yet")

			console.log("Starting files accepting")
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
				// TODO(teawithsand): check received header against header provided
				const receivedHeader: FileTransferEntryHeader =
					await conn.messageQueue.receive()

				console.log(
					"Starting files accepting; received header",
					receivedHeader,
					"to header",
					header
				)

				let resultBlob = new Blob([])
				let bytesLeft = header.size

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

					// TODO(teawithsand): check sha512hash of result here

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
							sha512hash: header.sha512hash,
						})
					})
				)
			}

			await receiveMagic(MAGIC_END_OF_FILES)
			// magic on receiving is done. It should ve validated.

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

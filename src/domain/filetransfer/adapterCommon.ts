import {
	FileTransferAuth,
	FileTransferAuthResult,
	FileTransferAuthType,
	FileTransferHello,
	FileTransferVersion,
	MAGIC_AUTH_INIT,
	MAGIC_AUTH_SUCCESS,
	isFileTransferAuthNameValid,
} from "@app/domain/filetransfer/defines"
import { IDataConnection } from "@teawithsand/tws-peer"
import { randomArrayBufferSync } from "@teawithsand/tws-stl"

const AUTH_NONCE_LENGTH = 512 / 8

export class FileTransferHelper {
	constructor(private readonly conn: IDataConnection) {}

	receiveMagic = async (magic: string) => {
		const res = await this.conn.messageQueue.receive()
		if (res !== magic) {
			throw new Error(`Magic receive filed. Wanted ${magic} got ${res}`)
		}
	}

	exchangeHello = async (): Promise<FileTransferHello> => {
		const hello: FileTransferHello = {
			version: FileTransferVersion.V1,
		}
		this.conn.send(hello)
		const remoteHello: FileTransferHello =
			await this.conn.messageQueue.receive()
		if (
			typeof remoteHello !== "object" ||
			remoteHello === null ||
			typeof remoteHello.version !== "number"
		)
			throw new Error("Invalid hello received")

		if (remoteHello.version !== hello.version) {
			throw new Error("Version mismatch")
		}

		return remoteHello
	}

	doAuthenticate = async (
		auth: FileTransferAuth
	): Promise<FileTransferAuthResult> => {
		const enc = new window.TextEncoder()
		const encodedSecret = enc.encode(auth.authSecret)

		const key = await window.crypto.subtle.importKey(
			"raw",
			// Any byte array can be used as HMAC secret, so it's ok.
			// No need to pre-hash it. HMAC will do it for us.
			encodedSecret,
			{
				name: "HMAC",
				hash: { name: "SHA-512" },
			},
			false, // export = false
			["sign", "verify"] // what this key can do
		)

		this.conn.send(MAGIC_AUTH_INIT)
		await this.receiveMagic(MAGIC_AUTH_INIT)

		if (auth.type === FileTransferAuthType.PROVIDE) {
			const nonce = await this.conn.messageQueue.receive()
			if (
				!(nonce instanceof ArrayBuffer) ||
				nonce.byteLength !== AUTH_NONCE_LENGTH
			) {
				throw new Error(`Invalid type of nonce received`)
			}
			const signRes = await window.crypto.subtle.sign("HMAC", key, nonce)

			this.conn.send({
				secret: signRes,
				name: auth.name,
			})

			await this.receiveMagic(MAGIC_AUTH_SUCCESS)
			const { name }: { name: string } =
				await this.conn.messageQueue.receive()
			if (typeof name !== "string") {
				throw new Error("Invalid name type received")
			}

			if (!isFileTransferAuthNameValid(name)) {
				throw new Error("Invalid name received")
			}

			return {
				remotePartyName: name,
			}
		} else {
			const nonce = randomArrayBufferSync(64)
			const signRes = await window.crypto.subtle.sign("HMAC", key, nonce)

			this.conn.send(nonce)

			const {
				name,
				secret,
			}: {
				secret: ArrayBuffer
				name: string
			} = await this.conn.messageQueue.receive()
			if (
				typeof name !== "string" ||
				!(secret instanceof ArrayBuffer) ||
				secret.byteLength != AUTH_NONCE_LENGTH
			) {
				throw new Error("Invalid auth parameters received")
			}

			if (!isFileTransferAuthNameValid(name)) {
				throw new Error("Invalid name received")
			}

			const a = new Uint8Array(signRes)
			const b = new Uint8Array(secret)

			// TODO(teawithsand): better(or just) timing safe equal here
			//  although, since nonces are unique, it should not be required
			let r = 0
			for (let i = 0; i < Math.max(a.length, b.length); i++) {
				r |= a[i] ^ b[i]
			}

			if (r !== 0) {
				throw new Error("Authentication filed")
			}

			this.conn.send(MAGIC_AUTH_SUCCESS)
			this.conn.send({
				name: auth.name,
			})

			return {
				remotePartyName: name,
			}
		}
	}
}

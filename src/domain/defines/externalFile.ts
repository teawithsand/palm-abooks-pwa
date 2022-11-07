export enum InternalFileOwnerDataType {
	ABOOK = 1,
}

export type InternalFileOwnerData = {
	type: InternalFileOwnerDataType.ABOOK
	abookId: string
}

export type InternalFile = {
	id: string
	blob: File | Blob
	owner: InternalFileOwnerData
}

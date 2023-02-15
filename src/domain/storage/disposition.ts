import { FileEntryDisposition } from "@app/domain/defines/abookFile"

export const guessDisposition = (
	data:
		| {
				mime: string
				name: string
		  }
		| {
				url: string
		  }
): FileEntryDisposition => {
	if ("url" in data) {
		const url = data.url

		if (/\.(mp3|ogg|wav|m4a|aac|flac|m4a)$/.test(url))
			return FileEntryDisposition.MUSIC
		if (/\.(jpg|jpeg|png|gif|webp)$/.test(url))
			return FileEntryDisposition.IMAGE

		return FileEntryDisposition.UNKNOWN
	} else {
		const { mime, name } = data

		if (/^audio\/.+$/.test(mime)) return FileEntryDisposition.MUSIC

		if (/^image\/.+$/.test(mime)) return FileEntryDisposition.IMAGE

		if (/\.(mp3|ogg|wav|m4a|aac|flac|m4a)$/.test(name))
			return FileEntryDisposition.MUSIC
		if (/\.(jpg|jpeg|png|gif|webp)$/.test(name))
			return FileEntryDisposition.IMAGE

		return FileEntryDisposition.UNKNOWN
	}
}

export const guessFileDisposition = (file: File) =>
	guessDisposition({
		mime: file.type,
		name: file.name,
	})

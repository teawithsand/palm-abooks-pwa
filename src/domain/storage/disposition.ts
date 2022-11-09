import { FileEntryDisposition, FileEntry } from "@app/domain/defines/abookFile"

export const guessDisposition = (data: {
	mime: string
	name: string
}): FileEntryDisposition => {
	const { mime, name } = data

	// 1. Guess using mime
	if (/^audio\/.+$/.test(mime)) return FileEntryDisposition.MUSIC

	if (/^image\/.+$/.test(mime)) return FileEntryDisposition.IMAGE

	// 2. guess using file name(extension)
	if (/\.(mp3|ogg|wav|m4a|aac|flac|m4a)$/.test(name))
		return FileEntryDisposition.MUSIC
	if (/\.(jpg|jpeg|png|gif|webp)$/.test(name))
		return FileEntryDisposition.IMAGE

	// 3. Just give up
	return FileEntryDisposition.UNKNOWN
}

export const guessFileDisposition = (file: File) =>
	guessDisposition({
		mime: file.type,
		name: file.name,
	})

export const guessFileEntryDisposition = (
	entry: FileEntry
): FileEntryDisposition =>
	guessDisposition({
		name: entry.metadata.name,
		mime: entry.metadata.mime,
	})

export const getFileEntryDisposition = (e: FileEntry): FileEntryDisposition =>
	e.metadata.disposition ?? guessFileEntryDisposition(e)

import {
	DefaultMetadataLoader,
	MetadataLoader,
	MetadataLoadingResult,
	MetadataLoadingResultType,
	PlayerSource,
	StaticPlayerSource,
} from "@teawithsand/tws-player"

// TODO(teawithsand): move this to tws-player, as it's right place for such function
// to be implemented in

/**
 * Loads metadata from loader to MetadataLoadingResult.
 *
 * It never throws.
 */
export const loadMetadataToResultHack = async (
	loader: MetadataLoader,
	source: PlayerSource
): Promise<MetadataLoadingResult> => {
	try {
		const metadata = await loader.loadMetadata(source)
		return {
			type: MetadataLoadingResultType.OK,
			metadata,
		}
	} catch (e) {
		return {
			type: MetadataLoadingResultType.ERROR,
			error: String(e) || "Unknown error",
		}
	}
}

export const loadBlobMetadataUtil = async (
	blob: Blob
): Promise<MetadataLoadingResult> => {
	const metadataLoader = new DefaultMetadataLoader()
	// Please note that this has to be done OUTSIDE addInternalFile callback, as it must be synchronous/await only
	// db promises
	const metadata = await loadMetadataToResultHack(
		metadataLoader,
		new StaticPlayerSource(blob)
	)
	return metadata
}

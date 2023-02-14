import {
	MetadataLoader,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "@teawithsand/tws-player"

// TODO(teawithsand): move this to tws-player, as it's right place for such function
// to be implemented in

/**
 * Loads metadata from loader to MetadataLoadingResult.
 * 
 * It never throws.
 */
export const loadMetadataToResultHack = async <T>(
	loader: MetadataLoader<T>,
	entry: T
): Promise<MetadataLoadingResult> => {
	try {
		const metadata = await loader.loadMetadata(entry)
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

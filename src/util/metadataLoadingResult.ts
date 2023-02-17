import { FilePlayerSourceResolver } from "@app/domain/managers/resolver"
import {
	DefaultMetadataLoader,
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

export const loadBlobMetadataUtil = async (
	blob: Blob
): Promise<MetadataLoadingResult> => {
	const metadataLoader = new DefaultMetadataLoader(
		new FilePlayerSourceResolver()
	)
	// Please note that this has to be done OUTSIDE addInternalFile callback, as it must be synchronous/await only
	// db promises
	const metadata = await loadMetadataToResultHack(metadataLoader, blob)
	return metadata
}

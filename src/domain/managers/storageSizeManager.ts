import {
	DefaultStickyEventBus,
	StickySubscribable,
	StorageManagerApiHelper,
} from "@teawithsand/tws-stl"

export type StorageSizeStats = {
	usageData: { used: number; max: number } | null
	isPersistent: boolean
}

export class StorageSizeManager {
	private readonly storageManager = StorageManagerApiHelper.instance

	private readonly storageSizeStatsBus =
		new DefaultStickyEventBus<StorageSizeStats>({
			isPersistent: false,
			usageData: null,
		})

	get storageStatsBus(): StickySubscribable<StorageSizeStats> {
		return this.storageSizeStatsBus
	}

	/**
	 * Requests StorageSizeStats update. Sends result to storage stats bus.
	 * Returns yielded stats.
	 */
	requestStatsUpdate = async (): Promise<StorageSizeStats> => {
		const estimate = await this.storageManager.estimateStorage()

		const converted: StorageSizeStats = {
			usageData:
				estimate?.quota !== undefined && estimate?.usage !== undefined
					? {
							max: estimate.quota ?? 0,
							used: estimate.usage ?? 0,
					  }
					: null,
			isPersistent: await this.storageManager.isPersistentStorage(),
		}

		this.storageSizeStatsBus.emitEvent(converted)
		return converted
	}

	/**
	 * Returns true if request had succeed. False otherwise.
	 */
	requestPersistentStorage = async (): Promise<boolean> => {
		const isPersistent = await this.storageManager.isPersistentStorage()
		if (!isPersistent) {
			const success = await this.storageManager.requestPersistentStorage()
			if (success) {
				// do update + check if request really succeeded
				return (await this.requestStatsUpdate()).isPersistent
			}else{
				return false
			}
		}
		return true
	}

	constructor() {}
}

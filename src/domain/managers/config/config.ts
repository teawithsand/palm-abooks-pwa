import {
	GlobalPlayerConfig,
	GlobalPlayerConfigSerializer,
	INIT_GLOBAL_PLAYER_CONFIG,
} from "@app/domain/defines/config/config"
import {
	INIT_PERSISTENT_GLOBAL_PLAYER_STATE,
	PersistentGlobalPlayerState,
	PersistentGlobalPlayerStateSerializer,
} from "@app/domain/defines/config/state"
import {
	DefaultConfigManager,
	LocalForageConfigStore,
	Serializer,
	ConfigManager as TWSConfigManager,
} from "@teawithsand/tws-config"
import localforage, { LOCALSTORAGE } from "localforage"

const FORAGE = localforage.createInstance({
	name: "palm-abooks-pwa",
	driver: [LOCALSTORAGE],
})

export const makeConfigManager = <T extends Record<string, any>, E extends {}>(
	key: string,
	defaultValue: T,
	serializer: Serializer<T, E>
): TWSConfigManager<T> => {
	return new DefaultConfigManager(
		defaultValue,
		serializer,
		new LocalForageConfigStore(FORAGE, "/" + key),
		5000,
		(a, b) => a === b
	)
}

export class ConfigManager {
	public readonly globalPlayerConfig: TWSConfigManager<GlobalPlayerConfig> =
		makeConfigManager(
			"global-player-config",
			INIT_GLOBAL_PLAYER_CONFIG,
			GlobalPlayerConfigSerializer
		)

	public readonly globalPersistentPlayerState: TWSConfigManager<PersistentGlobalPlayerState> =
		makeConfigManager(
			"persistent-player-state",
			INIT_PERSISTENT_GLOBAL_PLAYER_STATE,
			PersistentGlobalPlayerStateSerializer
		)

	public readonly loadedPromise = Promise.all([
		this.globalPlayerConfig.loadedPromiseBus.lastEvent,
		this.globalPersistentPlayerState.loadedPromiseBus.lastEvent,
	])

	private innerSaveAll = async () => {
		await this.globalPlayerConfig.save()
		await this.globalPersistentPlayerState.save()
	}

	initialize = async () => {
		await this.globalPlayerConfig.load()
		await this.globalPersistentPlayerState.load()

		window.addEventListener("blur", () => {
			// Save config once user alt-tabs out of window
			this.innerSaveAll()
		})

		window.addEventListener("beforeunload", () => {
			// why not try saving something before exit?
			this.innerSaveAll()
		})
	}

	saveAll = async () => {
		await this.loadedPromise
		this.innerSaveAll()
	}
}

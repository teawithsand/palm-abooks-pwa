import { ConfigManager } from "@app/domain/managers/config/config"
import { NewPlayerManager } from "@app/domain/managers/newPlayer/player/playerManager"
import { SeekBackManager } from "@app/domain/managers/newPlayer/seekBack/seekBackManager"

export class ConfigSyncManager {
	constructor(
		configManager: ConfigManager,
		playerManager: NewPlayerManager,
		seekBackManager: SeekBackManager
	) {
		configManager.globalPlayerConfig.configBus.addSubscriber((config) => {
			if (!config) return

			playerManager.mutatePlayerConfig((draft) => {
				draft.speed = config.speed
				draft.preservePitchForSpeed = config.preservePitchForSpeed
			})

			seekBackManager.setStrategy(config.seekBackStrategy)
		})
	}
}

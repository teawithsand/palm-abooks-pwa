import { BaseCommand } from "@app/domain/managers/command/base"
import { DefaultEventBus, Subscribable } from "@teawithsand/tws-stl"

/**
 * Note: there should be only *one* subscriber for each command. Think of it as abstraction for calling a method.
 * These were introduced, so users which do not require data reading, may not access managers directly.
 */
export class CommandManager {
	private readonly innerBus = new DefaultEventBus<BaseCommand>()

	get bus(): Subscribable<BaseCommand> {
		return this.innerBus
	}

    uiSendCommand = (command: BaseCommand) => {
        this.innerBus.emitEvent(command)
    }

	constructor() {}
}

import { WhatToPlayLocator } from "@app/domain/defines/whatToPlay/locator"
import { BaseCommand } from "@app/domain/managers/command/base"

export class SetWhatToPlayLocatorCommand extends BaseCommand {
	constructor(public readonly locator: WhatToPlayLocator | null) {
		super()
	}
}

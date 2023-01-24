import { PeerHelper, generateSecureClientId } from "@teawithsand/tws-peer"
import {
	DefaultStickyEventBus,
	StickySubscribable,
	throwExpression,
} from "@teawithsand/tws-stl"
import { createContext, useContext } from "react"

export class FileTransferContextHelper {
	private readonly innerAuthSecretBus = new DefaultStickyEventBus(
		generateSecureClientId()
	)
	constructor(public readonly helper: PeerHelper) {}

	get authSecretBus(): StickySubscribable<string> {
		return this.authSecretBus
	}

	regenerateAuthSecret = () => {
		this.innerAuthSecretBus.emitEvent(generateSecureClientId())
	}
}

export const PeerHelperContext = createContext<PeerHelper | null>(null)

export const usePeerHelper = () =>
	useContext(PeerHelperContext) ??
	throwExpression(new Error("No peer helper found"))

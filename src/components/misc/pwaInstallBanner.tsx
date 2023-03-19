import { useAppManager } from "@app/domain/managers/app"
import { InstallPromptManagerStateType } from "@app/domain/managers/installPromptManager"
import { PwaApiHelper } from "@teawithsand/tws-stl"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"
import { Alert } from "react-bootstrap"

export const PwaInstallBanner = () => {
	if (!!PwaApiHelper.instance.isRunningPwa()) {
		return <></>
	}

	const app = useAppManager()
	const state = useStickySubscribable(app.installPromptManager.bus)
	if (state.type === InstallPromptManagerStateType.RECEIVED_NOT_USED_YET) {
		return (
			<Alert variant="success">
				You are not using this app as PWA.{" "}
				<a
					href="#"
					onClick={(e) => {
						e.preventDefault()
						app.installPromptManager.triggerPromptIfAvailable()
					}}
				>
					Click here banner to install it as PWA and add it to your
					home screen.
				</a>{" "}
				<a
					href="#"
					onClick={(e) => {
						e.preventDefault()
						app.installPromptManager.dismiss()
					}}
				>
					Or click this text in order to dismiss this alert.
				</a>
			</Alert>
		)
	} else {
		return <></>
	}
}

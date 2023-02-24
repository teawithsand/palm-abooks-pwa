import { useAppManager } from "@app/domain/managers/app"
import { useMutation } from "@tanstack/react-query"
import { formatFileSize } from "@teawithsand/tws-stl"
import { useIsSsr, useStickySubscribable } from "@teawithsand/tws-stl-react"
import React, { useEffect } from "react"
import { Alert, Button } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

const StorageStatsContainer = styled.div`
	display: grid;
	grid-auto-flow: row;

	> div {
		font-size: 1.2em;
	}
`

export const useUserAgent = () => {
	const isSsr = useIsSsr()
	if (isSsr) {
		return ""
	} else {
		return window.navigator.userAgent
	}
}

export const StoragePanel = () => {
	const app = useAppManager()
	const ua = useUserAgent()
	const storageUsageData = useStickySubscribable(
		app.storageSizeManager.storageStatsBus
	)

	useEffect(() => {
		app.storageSizeManager.requestStatsUpdate()
	}, [app.storageSizeManager])

	const m = useMutation({
		mutationFn: async () => {
			const res = await app.storageSizeManager.requestPersistentStorage()
			await app.storageSizeManager.requestStatsUpdate()
			return res
		},
	})

	return (
		<Container>
			<Alert variant="warning">
				<h4>You are using PWA.</h4>
				You can still remove <b>all</b> your data by clearing browser
				data.
				<div></div>
				<b>Do not remove browser data if you do not want that.</b> Next
				time clear only history or use incognito mode or different
				browser.
				<div></div>
				Above warning also applies to app installed via web browser or
				Android app installed via Google Play.
				<div></div>
				<hr />
				{ua ? (
					<>
						The browser you are using right now is: <b>{ua}</b>
						<div></div>
						Knowing this is important if you installed app from some
						store like Google Play.
					</>
				) : null}
			</Alert>

			{!(m.data ?? true) ? (
				<Alert variant="danger">
					<h4>Persistent storage request has failed.</h4>
					<div></div>
					You may have denied persistent storage permission(likely
					Firefox).
					<div></div>
					Installing this app as PWA often helps. Try installing this
					website via Google Play or via browser as PWA.
				</Alert>
			) : null}
			{storageUsageData.usageData ? (
				<StorageStatsContainer>
					<h2>Storage statistics</h2>
					<div>
						Used:{" "}
						<b>{formatFileSize(storageUsageData.usageData.used)}</b>
					</div>
					<div>
						Capacity:{" "}
						<b>{formatFileSize(storageUsageData.usageData.max)}</b>
					</div>
					<div>
						Free:{" "}
						<b>
							{formatFileSize(
								Math.max(
									0,
									storageUsageData.usageData.max -
										storageUsageData.usageData.used
								)
							)}
						</b>
					</div>
				</StorageStatsContainer>
			) : (
				<div>
					No storage data is available. Your browser may not support
					StorageManager API. Try upgrading it.
				</div>
			)}

			{storageUsageData.isPersistent ? (
				<div>
					Your storage <b>is</b> persistent 😀. Browser won't{" "}
					<b>automatically</b> remove your data.
					<div></div>
					Note: browser will still automatically remove your data if
					you asked it to do so in settings. Firefox for example has
					clear-data-on-close option, which would still clear your
					data.
				</div>
			) : (
				<>
					<div>
						Your storage is <b>not</b> persistent. Browser can{" "}
						<b>automatically</b> remove your data.
						<hr />
						Aside from that, granting persistent storage permission
						often increases available storage size.
					</div>
					<Button
						onClick={() => {
							m.mutate()
						}}
					>
						Request persistent storage
					</Button>
				</>
			)}
		</Container>
	)
}

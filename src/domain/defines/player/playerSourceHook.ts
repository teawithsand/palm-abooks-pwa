import { PlayerSource, PlayerSourceUrlClaim } from "@teawithsand/tws-player"
import { useEffect, useState } from "react"

export const usePlayerSourceUrl = (
	source: PlayerSource | null
): string | null => {
	const [url, setUrl] = useState<string | null>(null)

	useEffect(() => {
		setUrl(null)

		let isFreed = false
		let claim: PlayerSourceUrlClaim | null = null
		const p = async () => {
			claim = (await source?.claimUrl()) ?? null
			if (claim && !isFreed) {
				setUrl(claim.url)
			}
		}

		p()
		return () => {
			isFreed = true
			claim?.close()
		}
	}, [source])

	return url
}

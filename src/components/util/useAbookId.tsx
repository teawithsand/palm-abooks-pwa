type ABookNavData = {
	id: string
}

export const makeAbookNavigationHash = (id: string) => {
	const nd: ABookNavData = { id }
	return encodeURIComponent(JSON.stringify(nd))
}

export const useAbookId = (): string => {
	try {
		let res = window.location.hash
		if(res.startsWith("#")) {
			res = res.slice(1)
		}
		const nd: ABookNavData = JSON.parse(
			decodeURIComponent(res) || ""
		)

		return nd.id || ""
	} catch (e) {
		console.error(e)
		throw new Error("no Abook ID provided")
	}
}

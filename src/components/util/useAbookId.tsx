export const useAbookId = (): string => {
	// FIXME: use some watcher instead of doing this
	const abookId = new URLSearchParams(window.location.search).get("id")
	if (!abookId) throw new Error("no Abook ID provided")

	return abookId
}

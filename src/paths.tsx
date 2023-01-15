import {
	Paths,
	useLanguagePrefixedPaths,
	UseLanguagePrefixedPathsConfig,
} from "@teawithsand/tws-trans"

export interface AppPaths extends Paths {
	homePath: string
	abookAddLocalPath: string
	abookListPath: string
	abookManagementPath: string
	storageInfoPath: string
	abookShowPath: (id: string) => string
	abookEditMetadataPath: (id: string) => string
	abookDeletePath: (id: string) => string
	abookReorderEntriesPath: (id: string) => string
	abookLocalEntriesAddPath: (id: string) => string
	abookEntriesDeletePath: (id: string) => string
	abookReceiveFilesPath: (id: string) => string
	// TODO(teawithsand): TBD
	// abookSendPath: (id: string) => string
	// abookReceivePath: string

	sendFilesPath: string
	playerUiPath: string
	playerPlaylistPath: string
	playerOptionsPath: string
}

const paths: AppPaths = {
	homePath: "/",
	abookAddLocalPath: "/abook/local-add",
	abookListPath: "/abook/list",
	storageInfoPath: "/storage",
	abookShowPath: (id: string) => {
		// try using hash instead, so it works better with cache
		return `/abook/show?id=${encodeURIComponent(id)}`
	},
	abookEditMetadataPath: (id: string) => {
		return `/abook/edit-metadata?id=${encodeURIComponent(id)}`
	},
	abookDeletePath: (id: string) => {
		return `/abook/delete?id=${encodeURIComponent(id)}`
	},
	abookReorderEntriesPath: (id: string) => {
		return `/abook/reorder-entries?id=${encodeURIComponent(id)}`
	},
	abookLocalEntriesAddPath: (id: string) => {
		return `/abook/local-entries-add?id=${encodeURIComponent(id)}`
	},
	abookEntriesDeletePath: (id: string) => {
		return `/abook/entries-delete?id=${encodeURIComponent(id)}`
	},
	abookReceiveFilesPath: (id: string) => {
		return `/abook/remote/receive?id=${encodeURIComponent(id)}`
	},

	sendFilesPath: "/remote/send",
	abookManagementPath: "/store/abook",
	playerUiPath: "/player",
	playerPlaylistPath: "/player/playlist",
	playerOptionsPath: "/player/options",
}

const config: UseLanguagePrefixedPathsConfig = {
	allowedLanguages: ["en-US"],
	defaultLanguage: "en-US",
}

export const useAppPaths = (): AppPaths =>
	useLanguagePrefixedPaths(paths, config)

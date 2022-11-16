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
	abookShowPath: (id: string) => string
	abookEditMetadataPath: (id: string) => string
	abookDeletePath: (id: string) => string
	abookReorderEntriesPath: (id: string) => string
	abookLocalEntriesAddPath: (id: string) => string
	abookEntriesDeletePath: (id: string) => string

	playerPath: string
}

const paths: AppPaths = {
	homePath: "/",
	abookAddLocalPath: "/abook/local-add",
	abookListPath: "/abook/list",
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

	abookManagementPath: "/store/abook",
	playerPath: "/player",
}

const config: UseLanguagePrefixedPathsConfig = {
	allowedLanguages: ["en-US"],
	defaultLanguage: "en-US",
}

export const useAppPaths = (): AppPaths =>
	useLanguagePrefixedPaths(paths, config)

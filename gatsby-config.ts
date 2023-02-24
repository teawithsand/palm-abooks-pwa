import {
	customizeDefaultPlugins,
	makeConfig,
	makeLayoutPlugin,
	makeManifestPlugin,
	makeSelfPlugin,
	makeOfflinePlugin,
} from "@teawithsand/tws-gatsby-plugin"

const plugins = customizeDefaultPlugins(
	[
		makeManifestPlugin("./src/images/icon-prefix-magic-icon.png", {
			cache_busting_mode: 'none',
			lang: 'en',
			name: `PalmABooks PWA`,
			short_name: `PalmABooks`,
			description: "It plays and stores user-provided ABooks.",
			start_url: `/`,
			background_color: `#f7f0eb`,
			theme_color: `#a2466c`,
			display: `standalone`,
		}),
		makeLayoutPlugin("./src/Layout.tsx"),
		makeOfflinePlugin({
			cacheId: "palm-abooks-pwa-app-cache"
		})
	],
	[
		makeSelfPlugin({
			languages: ["en-US"],
		}),
	]
)
const config = makeConfig(
	{
		title: `Teawithsand's ABook Player PWA`,
		siteUrl: `https://abook.teawithsand.com`,
	},
	plugins
)

export default config

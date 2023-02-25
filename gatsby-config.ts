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
			cache_busting_mode: "none",
			lang: "en",
			name: `PalmABooks PWA`,
			short_name: `PalmABooks`,
			description: "It plays and stores user-provided ABooks.",
			start_url: `/`,
			background_color: `#f7f0eb`,
			theme_color: `#a2466c`,
			display: `standalone`,
		}),
		makeLayoutPlugin("./src/Layout.tsx"),
	],
	[
		makeSelfPlugin({
			languages: ["en-US"],
		}),
	],
	[
		makeOfflinePlugin({
			cacheId: "palm-abooks-pwa-app-cache",
			workboxConfigModifier: (wbc) => {
				wbc.globPatterns = [
					"**/*.{js,css,html,json}",
				]
				return wbc
			}
		}),

		/*
		{
			resolve: "gatsby-plugin-offline",
			options: {
				precachePages: ["*", "** /*", "/ *"],
				workboxConfig: {
					importWorkboxFrom: `local`,
					cacheId: "palm-abooks-pwa-app-cache",
					// Don't cache-bust JS or CSS files, and anything in the static directory,
					// since these files have unique URLs and their contents will never change
					dontCacheBustURLsMatching: /(\.js$|\.css$|static\/)/,
					globPatterns: [
						"** / *.{js,css,html}",
						//  " ** /icon-prefix-magic*",
					],
					runtimeCaching: [
						{
							// Use cacheFirst since these don't need to be revalidated (same RegExp
							// and same reason as above)
							urlPattern: /(\.js$|\.css$|static\/)/,
							handler: `CacheFirst`,
						},
						{
							// page-data.json files, static query results and app-data.json
							// are not content hashed
							urlPattern: /^https?:.*\/page-data\/.*\.json/,
							handler: `StaleWhileRevalidate`,
						},
						{
							// Add runtime caching of various other page resources
							// These are not critical and can be stale-while-revalidate
							// Also: most of them is cache-busted anyway
							urlPattern:
								/^https?:.*\.(png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|json|css)$/,
							handler: `StaleWhileRevalidate`,
						},
						{
							// Google Fonts CSS (doesn't end in .css so we need to specify it)
							urlPattern:
								/^https?:\/\/fonts\.googleapis\.com\/css/,
							handler: `StaleWhileRevalidate`,
						},

						{
							// Use cacheFirst since these don't need to be revalidated (same RegExp
							// and same reason as above)
							urlPattern: /^https?:.*\/page-data\/.*\.json/,
							handler: `NetworkFirst`,
						},
					],
					skipWaiting: true,
					clientsClaim: true,
				},
			},
		}
		*/
	]
)
const config = makeConfig(
	{
		title: `Teawithsand's ABook Player PWA`,
		siteUrl: `https://abook.teawithsand.com`,
	},
	[
		...plugins,
	]
)

export default config

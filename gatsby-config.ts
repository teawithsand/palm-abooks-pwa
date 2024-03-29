import {
	customizeDefaultPlugins,
	makeConfig,
	makeLayoutPlugin,
	makeManifestPlugin,
	makeSelfPlugin,
	loadConfig,
} from "@teawithsand/tws-gatsby-plugin"
import { Config } from "@teawithsand/tws-gatsby-plugin-sw"

const swOptions: Config = {
	appendScript: null,
	makeWorkboxConfig: (template, data) => {
		template.inlineWorkboxRuntime = true
		template.navigateFallback = "/app-shell"

		template.globPatterns = [...data.otherFiles]
		for (const p of data.pages) {
			template.globPatterns.push(...p.dependencies)
		}
		template.globPatterns.push("page-data/**")
		template.globPatterns.push("icons/**")
		template.additionalManifestEntries = []
		for (const p of data.pages) {
			template.additionalManifestEntries.push({
				url: p.path,
				revision: p.indexHtmlHash,
			})
		}
		template.cacheId = "palm-abooks-pwa/app-cache"
		template.globIgnores = [
			"**/node_modules/**/*",
			"*.gz",
			".gz",
			"*/**/*.gz",
			"**/*.gz",
			"/*.gz",
		]

		return template
	},
	precachePages: ["/**/*", "/*"],
}

const plugins = customizeDefaultPlugins(
	[
		makeManifestPlugin("./src/images/icon-prefix-magic-icon.png", {
			cache_busting_mode: "none",
			lang: "en",
			name: `PalmABooks PWA`,
			short_name: `PalmABooks`,
			description: "It plays and stores user-provided ABooks.",
			start_url: `/?version=${loadConfig().version}`,
			background_color: `#f7f0eb`,
			theme_color: `#a2466c`,
			display: `standalone`,
			icon_options: {
				// For all the options available,
				// please see the section "Additional Resources" below.
				purpose: `any maskable`,
			},
		} as any),
		makeLayoutPlugin("./src/Layout.tsx"),
	],
	[
		makeSelfPlugin({
			languages: ["en-US"],
		}),
	],
	[
		{
			resolve: "@teawithsand/tws-gatsby-plugin-sw",
			options: swOptions,
		},
	]
)
const config = makeConfig({}, [...plugins])

export default config

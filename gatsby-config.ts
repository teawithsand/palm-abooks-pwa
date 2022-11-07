import {
	customizeDefaultPlugins,
	GatsbyTransformerRemarkPlugins,
	makeConfig,
	makeLayoutPlugin,
	makeManifestPlugin,
	makeSelfPlugin,
} from "tws-gatsby-plugin"

const plugins = customizeDefaultPlugins(
	[
		makeManifestPlugin("./src/images/icon.png"),
		makeLayoutPlugin("./src/Layout.jsx"),
	],
	[
		makeSelfPlugin({
			languages: ["en-US"],
		}),
	],
	GatsbyTransformerRemarkPlugins,
)
const config = makeConfig(
	{
		title: `PalmABooks PWA`,
		siteUrl: `https://pwa.palmabooks.com`,
	},
	plugins,
)

export default config

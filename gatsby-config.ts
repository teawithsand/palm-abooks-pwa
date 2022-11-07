import {
	customizeDefaultPlugins,
	GatsbyTransformerRemarkPlugins,
	makeConfig,
	makeLayoutPlugin,
	makeManifestPlugin,
	makeSelfPlugin,
} from "@teawithsand/tws-gatsby-plugin"

const plugins = customizeDefaultPlugins(
	[
		makeManifestPlugin("./src/images/icon.png"),
		// makeLayoutPlugin("./src/Layout.jsx"),
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
		title: `Teawithsand's ABook Player PWA`,
		siteUrl: `https://abook.teawithsand.com`,
	},
	plugins,
)

export default config

export const onCreateWebpackConfig = ({ stage, loaders, actions }) => {
	if (stage === "build-html" || stage === "develop-html") {
		actions.setWebpackConfig({
			module: {
				rules: [
					{
						test: /peerjs/,
						use: loaders.null(),
					},
				],
			},
		})
	}
}

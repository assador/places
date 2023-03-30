module.exports = {
	devServer: {
		proxy: {
			'^/(backend|upload)': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
		},
	},
//	lintOnSave: false,
	css: {
//		requireModuleExtension: false,
	},
};

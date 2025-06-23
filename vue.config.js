const webpack = require('webpack');

module.exports = {
	devServer: {
		proxy: {
			'^/(backend|upload)': {
				target: 'http://localhost:5277',
				changeOrigin: true,
			},
		},
	},
//	lintOnSave: false,
	css: {
//		requireModuleExtension: false,
	},
	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
			}),
		],
	},
};

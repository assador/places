const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const production = process.env.NODE_ENV === 'production';

module.exports = {
	mode: production ? "production" : "development",
	entry: './src/main.js',
	output: {
		path: path.resolve(__dirname, './dist'),
		publicPath: '/',
		filename: './scripts/build.js',
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
//					'vue-style-loader',
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hot: !production,
						},
					},
					'css-loader',
				],
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]?[hash]',
				},
			},
		],
	},
	plugins: [
		new VueLoaderPlugin(),
		new MiniCssExtractPlugin({
			filename: './css/styles.css',
		}),
		new OptimizeCSSAssetsPlugin({
			assetNameRegExp: /\.css$/g,
			cssProcessor: require('cssnano'),
			cssProcessorPluginOptions: {
				preset: [
					'default',
					{
						discardComments: {
							removeAll: true,
						},
					},
				],
			},
			canPrint: true,
		}),
	],
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm.js'
		},
		extensions: [
			'*', '.js', '.vue', '.json',
		],
	},
	devServer: {
		index: '',
		host: 'places.localhost',
		port: 8000,
		proxy: {
			'**': {
				target: 'http://places.localhost',
				changeOrigin: true,
			},
		},
		overlay: true,
		clientLogLevel: "silent",
		noInfo: true,
		inline: true,
		hot: true,
	},
	performance: {
		hints: false,
	},
	optimization: {
		minimize: true,
	},
	devtool: '#eval-source-map',
}

if(production) {
	module.exports.devtool = '#source-map';
	module.exports.plugins = (module.exports.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"',
			},
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
		}),
	]);
}

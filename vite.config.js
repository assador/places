import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
			manifest: {
				name: 'Места — Персональный ГеоОрганайзер',
				short_name: 'Места',
				description: 'Персональная геобиблиотека: коллекции мест и маршрутов, иерархии, взаимосвязи, описания, фотоальбомы, поиск, сортировка и инструменты работы с пространством.',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'masked-icon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'maskable',
					}, {
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					}, {
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
			workbox: {
				navigateFallbackDenylist: [/^\/backend/],
				runtimeCaching: [
					{
						urlPattern: /^\/backend\/.*$/,
						handler: 'NetworkOnly',
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
	},
	server: {
		proxy: {
			'/backend': 'http://localhost:5277',
		},
	},
	test: {
		testTimeout: 10000,
		environment: 'happy-dom',
	},
});

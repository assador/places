import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

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
						urlPattern: /^\/(backend|raw)\/.*$/,
						handler: 'NetworkOnly',
					},
				],
			},
		}),
		basicSsl(),
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
		host: true,
		https: true,
		port: 5173,
		proxy: {
			'/backend': 'http://localhost:5277',
		},
	},
	test: {
		exclude: [
			...configDefaults.exclude,
			'tests/ignored/**',
			'**/temp/**',
		],
		environment: 'jsdom',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
	},
});

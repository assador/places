import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import App from '../App.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
	{
		path: '/',
		name: 'App',
		component: App
	},
]

const router = new VueRouter({
	mode: 'history',
	base: process.env.BASE_URL,
	routes
})

export default router

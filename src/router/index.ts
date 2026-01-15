import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const Auth = () => import('@/components/Auth.vue');
const Home = () => import('@/components/Home.vue');
const Admin = () => import('@/components/Admin.vue');
const Account = () => import('@/components/Account.vue');
const AccountDelete = () => import('@/components/AccountDelete.vue');
const PopupText = () => import('@/components/PopupText.vue');
const PopupImage = () => import('@/components/PopupImage.vue');
const PopupFolder = () => import('@/components/PopupFolder.vue');
const PopupFolderDelete = () => import('@/components/PopupFolderDelete.vue');
const PopupExport = () => import('@/components/PopupExport.vue');

const routes: RouteRecordRaw[] = [
	{
		path: '/auth',
		name: 'Auth',
		component: Auth,
		children: [
			{
				path: 'text/:what',
				name: 'AuthText',
				component: PopupText,
				props: true,
			},
		],
	}, {
		path: '/home',
		name: 'Home',
		component: Home,
		children: [
			{
				path: 'text/:what',
				name: 'HomeText',
				component: PopupText,
				props: true,
			}, {
				path: 'images/:imageId',
				name: 'HomeImages',
				component: PopupImage,
				props: true,
			}, {
				path: 'folder/:parentId?',
				name: 'HomeFolder',
				component: PopupFolder,
				props: true,
			}, {
				path: 'deletefolder?id=:id&type=:type?',
				name: 'HomeDeleteFolder',
				component: PopupFolderDelete,
				props: true,
			}, {
				path: 'export',
				name: 'HomeExport',
				component: PopupExport,
				props: true,
			}, 
		],
	}, {
		path: '/account',
		name: 'Account',
		component: Account,
		children: [
			{
				path: 'delete',
				name: 'AccountDelete',
				component: AccountDelete,
			},
		],
	}, {
		path: '/about',
		name: 'About',
		component: PopupText,
	}, {
		path: '/admin',
		name: 'Admin',
		component: Admin,
	}, {
		path: '/:catchAll(.*)*',
		redirect: '/home',
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

router.beforeEach((to, from, next) => {
	if (!sessionStorage.getItem('places-session')) {
		if (
			to.name !== 'Auth' &&
			to.name !== 'About' &&
			to.name !== 'AuthText'
		) {
			next({name: 'Auth'});
		} else {
			next();
		}
	} else {
		next();
	}
});

export default router;

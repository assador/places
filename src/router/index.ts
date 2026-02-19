import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const Auth = () => import('@/components/Auth.vue');
const Home = () => import('@/components/Home.vue');
const Admin = () => import('@/components/admin/Admin.vue');
const Account = () => import('@/components/account/Account.vue');
const AccountDelete = () => import('@/components/account/AccountDelete.vue');
const PopupText = () => import('@/components/popups/PopupText.vue');
const PopupImage = () => import('@/components/popups/PopupImage.vue');
const PopupFolder = () => import('@/components/popups/PopupFolder.vue');
const PopupFolderDelete = () => import('@/components/popups/PopupFolderDelete.vue');
const PopupExport = () => import('@/components/popups/PopupExport.vue');

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
				path: 'folder',
				name: 'HomeFolder',
				component: PopupFolder,
				props: route => ({
					parent: route.query.parent || null,
					context: route.query.context || 'places',
				}),
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

router.beforeEach((to, _, next) => {
	if (!localStorage.getItem('places-session')) {
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

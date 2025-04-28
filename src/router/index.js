import { createRouter, createWebHistory } from 'vue-router';
const PlacesAuth = () => import('@/components/PlacesAuth.vue');
const PlacesHome = () => import('@/components/PlacesHome.vue');
const PlacesAdmin = () => import('@/components/PlacesAdmin.vue');
const PlacesAccount = () => import('@/components/PlacesAccount.vue');
const PlacesAccountDelete = () => import('@/components/PlacesAccountDelete.vue');
const PlacesPopupText = () => import('@/components/PlacesPopupText.vue');
const PlacesPopupImage = () => import('@/components/PlacesPopupImage.vue');
const PlacesPopupFolder = () => import('@/components/PlacesPopupFolder.vue');
const PlacesPopupFolderDelete = () => import('@/components/PlacesPopupFolderDelete.vue');
const PlacesPopupExport = () => import('@/components/PlacesPopupExport.vue');
const routes = [
    {
        path: '/auth',
        name: 'PlacesAuth',
        component: PlacesAuth,
        children: [
            {
                path: 'text/:what',
                name: 'PlacesAuthText',
                component: PlacesPopupText,
                props: true,
            },
        ],
    }, {
        path: '/home',
        name: 'PlacesHome',
        component: PlacesHome,
        children: [
            {
                path: 'text/:what',
                name: 'PlacesHomeText',
                component: PlacesPopupText,
                props: true,
            }, {
                path: 'images/:imageId',
                name: 'PlacesHomeImages',
                component: PlacesPopupImage,
                props: true,
            }, {
                path: 'folder',
                name: 'PlacesHomeFolder',
                component: PlacesPopupFolder,
            }, {
                path: 'deletefolder/:folderId',
                name: 'PlacesHomeDeleteFolder',
                component: PlacesPopupFolderDelete,
                props: true,
            }, {
                path: 'export',
                name: 'PlacesHomeExport',
                component: PlacesPopupExport,
                props: true,
            },
        ],
    }, {
        path: '/account',
        name: 'PlacesAccount',
        component: PlacesAccount,
        children: [
            {
                path: 'delete',
                name: 'PlacesAccountDelete',
                component: PlacesAccountDelete,
            },
        ],
    }, {
        path: '/about',
        name: 'PlacesAbout',
        component: PlacesPopupText,
    }, {
        path: '/admin',
        name: 'PlacesAdmin',
        component: PlacesAdmin,
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
        if (to.name !== 'PlacesAuth' &&
            to.name !== 'PlacesAbout' &&
            to.name !== 'PlacesAuthText') {
            next({ name: 'PlacesAuth' });
        }
        else {
            next();
        }
    }
    else {
        next();
    }
});
export default router;
//# sourceMappingURL=index.js.map
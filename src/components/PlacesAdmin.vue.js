import { ref, defineAsyncComponent, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
;
import { useAdminStore } from '@/stores/admin';
;
import { useRouter } from 'vue-router';
//import { User, Group } from '@/store/types';
import axios from 'axios';
import PlacesDashboard from './PlacesDashboard.vue';
import AdminNavigation from './admin/AdminNavigation.vue';
/*
export interface IPlacesAdminProps {
    prop: 0,
}
const props = withDefaults(defineProps<IPlacesAdminProps>(), {
    prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();
const router = useRouter();
const getUsers = async () => {
    axios.post('/backend/get_users.php', {
        user: {
            id: sessionStorage.getItem('places-userid'),
            password: mainStore.user.password,
        },
    })
        .then(response => {
        switch (response.data) {
            case false:
                throw new Error('Administrator’s password failed the verification');
                return;
            default:
                adminStore.setUsers(response.data);
        }
    });
};
provide('getUsers', getUsers);
const getGroups = async () => {
    axios.post('/backend/get_allgroups.php', {
        user: {
            id: sessionStorage.getItem('places-userid'),
            password: mainStore.user.password,
        },
    })
        .then(response => {
        switch (response.data) {
            case false:
                throw new Error('Administrator’s password failed the verification');
                return;
            default:
                adminStore.setGroups(response.data);
        }
    });
};
provide('getGroups', getGroups);
onMounted(() => {
    getUsers();
    getGroups();
});
const exit = async () => {
    mainStore.unload();
    router.push({ name: 'PlacesAuth' });
};
const component = ref('users');
provide('component', component);
const components = {
    users: {
        name: 'AdminUsers',
        component: defineAsyncComponent(() => import('./admin/AdminUsers.vue')),
    },
    groups: {
        name: 'AdminGroups',
        component: defineAsyncComponent(() => import('./admin/AdminGroups.vue')),
    },
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (!!__VLS_ctx.mainStore.user &&
    !!__VLS_ctx.adminStore.groups.find(g => g.parent === 'management')) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "grid",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        id: "top-left",
        ...{ class: "app-cell fieldwidth_100" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "top-basic",
        ...{ class: "app-cell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "top-basic-content",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "brand" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "basiccolor margin_bottom_0" },
    });
    (__VLS_ctx.mainStore.t.i.brand.header);
    const __VLS_0 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        to: "/account",
    }));
    const __VLS_2 = __VLS_1({
        to: "/account",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    (__VLS_ctx.mainStore.user ? __VLS_ctx.mainStore.user.login : 'o_O');
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    (__VLS_ctx.mainStore.t.i.brand.slogan);
    /** @type {[typeof PlacesDashboard, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(PlacesDashboard, new PlacesDashboard({}));
    const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMouseover: (...[$event]) => {
                if (!(!!__VLS_ctx.mainStore.user &&
                    !!__VLS_ctx.adminStore.groups.find(g => g.parent === 'management')))
                    return;
                __VLS_ctx.mainStore.setMouseOverMessages(true);
            } },
        ...{ onMouseout: (...[$event]) => {
                if (!(!!__VLS_ctx.mainStore.user &&
                    !!__VLS_ctx.adminStore.groups.find(g => g.parent === 'management')))
                    return;
                __VLS_ctx.mainStore.setMouseOverMessages(false);
            } },
        ...{ onClick: (...[$event]) => {
                if (!(!!__VLS_ctx.mainStore.user &&
                    !!__VLS_ctx.adminStore.groups.find(g => g.parent === 'management')))
                    return;
                __VLS_ctx.mainStore.clearMessages();
                ;
            } },
        id: "messages",
        ...{ class: "invisible" },
    });
    for (const [message, index] of __VLS_getVForSourceType((__VLS_ctx.mainStore.messages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            id: ('message-' + index),
            key: (index),
            ...{ class: "message border_1" },
        });
        (__VLS_ctx.mainStore.messages[index]);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "top-right",
        ...{ class: "app-cell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "control-buttons" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!!__VLS_ctx.mainStore.user &&
                    !!__VLS_ctx.adminStore.groups.find(g => g.parent === 'management')))
                    return;
                __VLS_ctx.router.push('/home');
            } },
        id: "actions-home",
        ...{ class: "actions-button" },
        title: (__VLS_ctx.mainStore.t.i.hints.exit),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.mainStore.t.i.buttons.home);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.exit) },
        id: "actions-exit",
        ...{ class: "actions-button" },
        title: (__VLS_ctx.mainStore.t.i.hints.exit),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.mainStore.t.i.buttons.exit);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "basic-left",
        ...{ class: "app-cell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "control-buttons" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "basic-basic",
        ...{ class: "app-cell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "admin-basic",
    });
    const __VLS_7 = ((__VLS_ctx.components[__VLS_ctx.component].component));
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
    const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "basic-right",
        ...{ class: "app-cell" },
    });
    /** @type {[typeof AdminNavigation, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(AdminNavigation, new AdminNavigation({}));
    const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "bottom-left",
        ...{ class: "app-cell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "control-buttons" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        id: "bottom-basic",
        ...{ class: "app-cell" },
    });
    const __VLS_14 = {}.RouterView;
    /** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['basiccolor']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['invisible']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['border_1']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PlacesDashboard: PlacesDashboard,
            AdminNavigation: AdminNavigation,
            mainStore: mainStore,
            adminStore: adminStore,
            router: router,
            exit: exit,
            component: component,
            components: components,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesAdmin.vue.js.map
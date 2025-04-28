import { computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
/*
const props = withDefaults(defineProps<IAdminNavigationProps>(), {
    prop: 0,
});
*/
const mainStore = useMainStore();
//const adminStore = useAdminStore();
const component = inject('component');
const sections = computed(() => ({
    users: mainStore.t.i.captions.users,
    groups: mainStore.t.i.captions.groups,
}));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({});
for (const [section, key] of __VLS_getVForSourceType((__VLS_ctx.sections))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.component = key;
            } },
        key: (key),
        ...{ class: "place-button block_01" },
        ...{ class: ({ ' active': key === __VLS_ctx.component }) },
    });
    (section);
}
/** @type {__VLS_StyleScopedClasses['place-button']} */ ;
/** @type {__VLS_StyleScopedClasses['block_01']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            component: component,
            sections: sections,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminNavigation.vue.js.map
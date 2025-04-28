import { ref, watch, computed, inject, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
/*
const props = withDefaults(defineProps<IAdminGroupsProps>(), {
    prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();
const tableMode = ref(1);
const sortBy = ref('');
const component = inject('component');
const sortKeys = computed(() => ({
    id: mainStore.t.i.captions.id,
    parent: mainStore.t.i.captions.parent,
    name: mainStore.t.i.captions.name,
    description: mainStore.t.i.captions.description,
    owner: mainStore.t.i.captions.owner,
    system: mainStore.t.i.captions.system,
    haschildren: mainStore.t.i.captions.haschildren,
}));
const groups = computed(() => adminStore.groups);
onMounted(() => {
    watch(() => sortBy.value, () => {
        adminStore.setGroupsSortBy(sortBy.value);
        adminStore.sort({ what: 'groups', by: sortBy.value });
    });
    sortBy.value = adminStore.groupsSortBy;
});
const goToUser = (id) => {
    const user = adminStore.users.find((u) => u.id === id);
    if (typeof user === 'undefined')
        return;
    adminStore.change({ where: user, what: 'checked', to: true });
    component.value = 'users';
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.mainStore.t.i.captions.groups);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__sortby" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.captions.srt);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "sort",
    value: (__VLS_ctx.sortBy),
});
for (const [value, key] of __VLS_getVForSourceType((__VLS_ctx.sortKeys))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (key),
        value: (key),
    });
    (value);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__tablemode" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tableMode = 1;
        } },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/list.svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tableMode = 2;
        } },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/tiles.svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tableMode = 3;
        } },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/list_01.svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (`table-${__VLS_ctx.tableMode} table-${__VLS_ctx.tableMode}_7`) },
});
if (__VLS_ctx.tableMode === 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [value, key] of __VLS_getVForSourceType((__VLS_ctx.sortKeys))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            key: (key),
        });
        (value);
    }
}
for (const [group, index] of __VLS_getVForSourceType((__VLS_ctx.groups))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (index),
    });
    for (const [value, key] of __VLS_getVForSourceType((group))) {
        (key);
        if ((value !== '' || __VLS_ctx.tableMode === 1) &&
            key !== 'checked') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            if (__VLS_ctx.tableMode !== 1) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                (__VLS_ctx.sortKeys[key]);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ({ 'impvalue': key === __VLS_ctx.sortBy }) },
            });
            if (key === 'owner') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                    ...{ onClick: (...[$event]) => {
                            if (!((value !== '' || __VLS_ctx.tableMode === 1) &&
                                key !== 'checked'))
                                return;
                            if (!(key === 'owner'))
                                return;
                            __VLS_ctx.goToUser(value);
                        } },
                    href: "javascript:void(0)",
                });
                (__VLS_ctx.adminStore.users.find(u => u.id === value).login);
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                ((typeof value === 'boolean'
                    ? (value === true
                        ? __VLS_ctx.mainStore.t.i.text.yes
                        : __VLS_ctx.mainStore.t.i.text.no)
                    : value));
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['control-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__sortby']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__tablemode']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['impvalue']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            mainStore: mainStore,
            adminStore: adminStore,
            tableMode: tableMode,
            sortBy: sortBy,
            sortKeys: sortKeys,
            groups: groups,
            goToUser: goToUser,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminGroups.vue.js.map
import { ref, watch, computed, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
/*
export interface IAdminUsersProps {
    prop: 0,
}
const props = withDefaults(defineProps<IAdminUsersProps>(), {
    prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();
const tableMode = ref(1);
const sortBy = ref('');
const sortKeys = computed(() => ({
    login: mainStore.t.i.captions.login,
    name: mainStore.t.i.captions.name,
    email: mainStore.t.i.captions.email,
    phone: mainStore.t.i.captions.phone,
    confirmed: mainStore.t.i.captions.confirmed,
    confirmbefore: mainStore.t.i.captions.confirmbefore,
}));
onMounted(() => {
    watch(() => sortBy.value, () => {
        adminStore.setUsersSortBy(sortBy.value);
        adminStore.sort({ what: 'users', by: sortBy.value });
    });
    sortBy.value = adminStore.usersSortBy;
});
const users = computed(() => adminStore.users);
const checkedAll = ref(false);
const checkAll = (check) => {
    for (const user of adminStore.users) {
        adminStore.change({
            where: user,
            what: 'checked',
            to: check,
        });
    }
    checkedAll.value = check;
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.mainStore.t.i.captions.users);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__checkuncheck" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.checkAll(__VLS_ctx.checkedAll ? false : true);
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons[__VLS_ctx.checkedAll ? 'uncheckAll' : 'checkAll']),
});
if (__VLS_ctx.checkedAll) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: "@/assets/icons/dark/uncheck.svg",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: "@/assets/icons/dark/check.svg",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__tablemode" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tableMode = 1;
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons.viewTable),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/list.svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tableMode = 2;
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons.viewTiles),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/tiles.svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tableMode = 3;
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons.viewHybrid),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/list_01.svg",
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
    ...{ class: "control-panel__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.captions.actions);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.checkAll(false);
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons.uncheckAll),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "@/assets/icons/dark/uncheck.svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (`table-${__VLS_ctx.tableMode} table-${__VLS_ctx.tableMode}_7`) },
});
if (__VLS_ctx.tableMode === 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({});
    for (const [value, key] of __VLS_getVForSourceType((__VLS_ctx.sortKeys))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            key: (key),
        });
        (value);
    }
}
for (const [user, index] of __VLS_getVForSourceType((__VLS_ctx.users))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (index),
        ...{ class: ({ 'active': __VLS_ctx.tableMode !== 1 && user.checked }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "user-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (e => {
                __VLS_ctx.adminStore.change({
                    where: user,
                    what: 'checked',
                    to: e.target.checked,
                });
                if (!e.target.checked)
                    __VLS_ctx.checkedAll = false;
            }) },
        type: "checkbox",
        checked: (user.checked),
    });
    for (const [value, key] of __VLS_getVForSourceType((user))) {
        (key);
        if ((value !== '' || __VLS_ctx.tableMode === 1) &&
            key !== 'id' &&
            key !== 'password' &&
            key !== 'token' &&
            key !== 'homeplace' &&
            key !== 'checked') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ({ 'active': __VLS_ctx.tableMode === 1 && user.checked }) },
            });
            if (__VLS_ctx.tableMode !== 1) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                (__VLS_ctx.sortKeys[key]);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ({ 'impvalue': key === __VLS_ctx.sortBy }) },
            });
            ((typeof value === 'boolean'
                ? (value === true
                    ? __VLS_ctx.mainStore.t.i.text.yes
                    : __VLS_ctx.mainStore.t.i.text.no)
                : value));
        }
    }
}
/** @type {__VLS_StyleScopedClasses['control-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__checkuncheck']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__tablemode']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__sortby']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['user-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
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
            users: users,
            checkedAll: checkedAll,
            checkAll: checkAll,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminUsers.vue.js.map
import { ref, onMounted, onUpdated, onBeforeUnmount, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
;
import { useRouter } from 'vue-router';
import { constants } from '../shared/constants';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { accountSaveRoutine, acc } from '../shared/account';
const mainStore = useMainStore();
const router = useRouter();
const accountLogin = ref(mainStore.user.login);
const accountNewPassword = ref('');
const accountNewPasswordRepeat = ref('');
const accountName = ref(mainStore.user.name);
const accountEmail = ref(mainStore.user.email);
const accountPhone = ref(mainStore.user.phone);
const account = ref(acc);
onMounted(async () => {
    await nextTick();
    makeFieldsValidatable(mainStore.t);
    document.addEventListener('keyup', keyup, false);
});
onUpdated(async () => {
    makeFieldsValidatable(mainStore.t);
});
onBeforeUnmount(() => {
    document.removeEventListener('keyup', keyup, false);
});
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.push({ name: 'PlacesHome' });
};
const keyup = (event) => {
    if (constants.shortcuts[event.code] === 'close')
        close(event);
};
const accountSubmit = function () {
    if (mainStore.user.testaccount) {
        account.value.message = mainStore.t.m.paged.taCannotBeChanged;
    }
    else {
        if (!document.querySelector('.value_wrong')) {
            const { accountLogin, accountNewPassword, accountNewPasswordRepeat, accountName, accountEmail, accountPhone, } = this;
            if (accountNewPassword === accountNewPasswordRepeat) {
                const accountId = sessionStorage.getItem('places-userid');
                accountSaveRoutine({
                    accountId,
                    accountLogin,
                    accountNewPassword,
                    accountName,
                    accountEmail,
                    accountPhone,
                }, mainStore.t);
            }
            else {
                account.value.message = mainStore.t.m.paged.passwordsNotMatch;
            }
        }
        else {
            account.value.message = mainStore.t.m.paged.incorrectFields;
        }
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "account centered" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.brand.header);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.captions.accountPage);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.accountSubmit) },
    ...{ class: "account__form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "table_form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.captions.login);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "accountLogin",
    value: (__VLS_ctx.accountLogin),
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regLogin),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.captions.newPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "accountNewPassword",
    ...{ class: "fieldwidth_100" },
    type: "password",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.needToChangePassword),
});
(__VLS_ctx.accountNewPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.captions.repeatNewPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "accountNewPasswordRepeat",
    ...{ class: "fieldwidth_100" },
    type: "password",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.needToChangePassword),
});
(__VLS_ctx.accountNewPasswordRepeat);
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.inputs.regAddressBy);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "accountName",
    value: (__VLS_ctx.accountName),
    ...{ class: "fieldwidth_100" },
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regAddressBy),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "accountEmail",
    value: (__VLS_ctx.accountEmail),
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "text",
    placeholder: "e-mail *",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.captions.phone);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "accountPhone",
    value: (__VLS_ctx.accountPhone),
    ...{ class: "fieldwidth_100" },
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.captions.phone),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
    ...{ class: "back_0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.save);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    type: "button",
});
(__VLS_ctx.mainStore.t.i.buttons.back);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'PlacesAccountDelete' }).catch(e => { console.error(e); });
        } },
    type: "button",
});
(__VLS_ctx.mainStore.t.i.buttons.deleteAccount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
    ...{ class: "back_0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    colspan: "2",
    ...{ style: {} },
});
(__VLS_ctx.account.message);
const __VLS_0 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['account']} */ ;
/** @type {__VLS_StyleScopedClasses['centered']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['account__form']} */ ;
/** @type {__VLS_StyleScopedClasses['table_form']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['back_0']} */ ;
/** @type {__VLS_StyleScopedClasses['back_0']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            mainStore: mainStore,
            router: router,
            accountLogin: accountLogin,
            accountNewPassword: accountNewPassword,
            accountNewPasswordRepeat: accountNewPasswordRepeat,
            accountName: accountName,
            accountEmail: accountEmail,
            accountPhone: accountPhone,
            account: account,
            close: close,
            accountSubmit: accountSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesAccount.vue.js.map
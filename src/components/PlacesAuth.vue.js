import { ref, nextTick, onMounted, onUpdated } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { loginRoutine, login } from '@/shared/auth';
import { regRoutine, reg } from '@/shared/reg';
import { forgotRoutine, forgot } from '@/shared/forgot';
import PlacesDashboard from './PlacesDashboard.vue';
import PWAPrompt from './PWAPrompt.vue';
const mainStore = useMainStore();
const router = useRouter();
const authLogin = ref('');
const authPassword = ref('');
const regLogin = ref('');
const regName = ref('');
const regPassword = ref('');
const regPasswordRepeat = ref('');
const regEmail = ref('');
const regPhone = ref('');
const forgotEmail = ref('');
const passwordShowHide = (input) => {
    input.type = input.type === 'password' ? input.type = 'text' : 'password';
};
const authLoginSubmit = () => {
    loginRoutine({
        authLogin: authLogin.value,
        authPassword: authPassword.value,
    }, mainStore.t);
};
const authRegSubmit = () => {
    if (document.querySelector('.value_wrong')) {
        reg.message = mainStore.t.m.paged.incorrectFields;
        return false;
    }
    if (regPassword.value !== regPasswordRepeat.value) {
        reg.message = mainStore.t.m.paged.passwordsNotMatch;
        return false;
    }
    regRoutine({
        regLogin: regLogin.value,
        regPassword: regPassword.value,
        regName: regName.value,
        regEmail: regEmail.value,
        regPhone: regPhone.value,
    }, mainStore.t);
    return true;
};
const authForgot = () => {
    if (!document.getElementById('forgotEmail').classList.contains('value_wrong')) {
        forgotRoutine({ forgotEmail: forgotEmail.value }, mainStore.t);
    }
    else {
        forgot.message = mainStore.t.m.paged.incorrectEmail;
    }
};
onMounted(async () => {
    await nextTick();
    makeFieldsValidatable(mainStore.t);
});
onUpdated(async () => {
    makeFieldsValidatable(mainStore.t);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['auth__login']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__registration']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__registration__fields']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth centered" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.brand.header);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.brand.slogan);
__VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
/** @type {[typeof PlacesDashboard, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PlacesDashboard, new PlacesDashboard({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth_forms" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth__login margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.authLoginSubmit) },
    ...{ class: "margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.mainStore.t.i.captions.auth);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth__login__fields margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "authLogin",
    value: (__VLS_ctx.authLogin),
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regLogin + ' ' +
        __VLS_ctx.mainStore.t.i.inputs.authTest),
    autofocus: true,
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "password nobr" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "authPassword",
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "password",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regPassword + ' ' +
        __VLS_ctx.mainStore.t.i.inputs.authTest),
});
(__VLS_ctx.authPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => {
            e.preventDefault();
            __VLS_ctx.passwordShowHide(e.target
                .previousElementSibling);
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.login);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "margin_bottom" },
});
(__VLS_ctx.login.message);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    onclick: "\u0064\u006f\u0063\u0075\u006d\u0065\u006e\u0074\u002e\u0071\u0075\u0065\u0072\u0079\u0053\u0065\u006c\u0065\u0063\u0074\u006f\u0072\u0028\u0027\u002e\u0061\u0075\u0074\u0068\u005f\u005f\u0066\u006f\u0072\u0067\u006f\u0074\u0027\u0029\u000a\u0009\u0009\u0009\u0009\u0009\u0009\u0009\u002e\u0063\u006c\u0061\u0073\u0073\u004c\u0069\u0073\u0074\u002e\u0074\u006f\u0067\u0067\u006c\u0065\u0028\u0027\u0068\u0069\u0064\u0064\u0065\u006e\u0027\u0029\u003b\u000a\u0009\u0009\u0009\u0009\u0009\u0009",
});
(__VLS_ctx.mainStore.t.i.buttons.forgot);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.authForgot) },
    ...{ class: "auth__forgot hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.text.emailToSendPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "forgotEmail",
    value: (__VLS_ctx.forgotEmail),
    ...{ class: "fieldwidth_100 margin_bottom" },
    required: true,
    type: "text",
    placeholder: "e-mail *",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.sendPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
(__VLS_ctx.forgot.message);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.authRegSubmit) },
    ...{ class: "auth__registration margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.mainStore.t.i.captions.reg);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth__registration__fields margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "regLogin",
    value: (__VLS_ctx.regLogin),
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regLogin),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "regName",
    value: (__VLS_ctx.regName),
    ...{ class: "fieldwidth_100" },
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regAddressBy),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "password nobr" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "regPassword",
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "password",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regPassword),
});
(__VLS_ctx.regPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => {
            e.preventDefault();
            __VLS_ctx.passwordShowHide(e.target
                .previousElementSibling);
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "password nobr" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "regPasswordRepeat",
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "password",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regRepeatPassword),
});
(__VLS_ctx.regPasswordRepeat);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => {
            e.preventDefault();
            __VLS_ctx.passwordShowHide(e.target
                .previousElementSibling);
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "regEmail",
    value: (__VLS_ctx.regEmail),
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "text",
    placeholder: "e-mail *",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "regPhone",
    value: (__VLS_ctx.regPhone),
    ...{ class: "fieldwidth_100" },
    type: "text",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.regPhone),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.register);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
(__VLS_ctx.reg.message);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'PlacesAuthText', params: { what: 'about' } }).catch(e => { console.error(e); });
        } },
    title: (__VLS_ctx.mainStore.t.i.hints.about),
});
(__VLS_ctx.mainStore.t.i.buttons.whatIsIt);
/** @type {[typeof PWAPrompt, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(PWAPrompt, new PWAPrompt({}));
const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
const __VLS_6 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['auth']} */ ;
/** @type {__VLS_StyleScopedClasses['centered']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['auth_forms']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__login']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__login__fields']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['password']} */ ;
/** @type {__VLS_StyleScopedClasses['nobr']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__forgot']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__registration']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['auth__registration__fields']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['password']} */ ;
/** @type {__VLS_StyleScopedClasses['nobr']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['password']} */ ;
/** @type {__VLS_StyleScopedClasses['nobr']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            login: login,
            reg: reg,
            forgot: forgot,
            PlacesDashboard: PlacesDashboard,
            PWAPrompt: PWAPrompt,
            mainStore: mainStore,
            router: router,
            authLogin: authLogin,
            authPassword: authPassword,
            regLogin: regLogin,
            regName: regName,
            regPassword: regPassword,
            regPasswordRepeat: regPasswordRepeat,
            regEmail: regEmail,
            regPhone: regPhone,
            forgotEmail: forgotEmail,
            passwordShowHide: passwordShowHide,
            authLoginSubmit: authLoginSubmit,
            authRegSubmit: authRegSubmit,
            authForgot: authForgot,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesAuth.vue.js.map
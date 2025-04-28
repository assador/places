import { ref, inject, onMounted } from 'vue';
import { constants } from '../shared/constants';
import { useMainStore } from '@/stores/main';
const props = withDefaults(defineProps(), {
    callback: null,
    arguments: null,
});
const mainStore = useMainStore();
const confirmPopup = inject('confirmPopup');
const popuped = ref(false);
const close = (event) => {
    if (event)
        event.stopPropagation();
    popuped.value = false;
    window.setTimeout(() => {
        confirmPopup.value = false;
    }, 1000);
};
const keyup = (event) => {
    if (constants.shortcuts[event.code] === 'close')
        close(event);
};
onMounted(() => {
    document.addEventListener('keyup', keyup, false);
    window.setTimeout(() => { popuped.value = true; }, 1);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    callback: null,
    arguments: null,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    ...{ class: ('popup ' + (__VLS_ctx.popuped ? 'appear' : 'disappear')) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-content centered" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.captions.sure);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onClick: (e => e.stopPropagation()) },
    ...{ onSubmit: (e => { props.callback(...props.arguments); __VLS_ctx.close(e); }) },
    ...{ class: "folder-delete__form margin_bottom_0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.yes);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    type: "button",
});
(__VLS_ctx.mainStore.t.i.buttons.cancel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    href: "javascript:void(0);",
    ...{ class: "close" },
});
/** @type {__VLS_StyleScopedClasses['popup-content']} */ ;
/** @type {__VLS_StyleScopedClasses['centered']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['folder-delete__form']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            mainStore: mainStore,
            popuped: popuped,
            close: close,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesPopupConfirm.vue.js.map
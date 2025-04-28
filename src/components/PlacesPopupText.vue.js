import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PlacesAbout from './PlacesAbout.vue';
const props = withDefaults(defineProps(), {
    what: '',
});
const popuped = ref(false);
const router = useRouter();
const route = useRoute();
watch(() => props.what, () => {
    popuped.value = (props.what === '' ? false : true);
});
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event) => {
    if (event.code === 'Escape')
        close(event);
};
onMounted(() => {
    document.addEventListener('keyup', keyup, false);
    window.setTimeout(() => {
        popuped.value = (props.what === '' ? false : true);
    }, 1);
});
onBeforeUnmount(() => {
    document.removeEventListener('keyup', keyup, false);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    what: '',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    ...{ class: ('popup ' + (__VLS_ctx.popuped ? 'appear' : 'disappear')) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
if (props.what === 'about') {
    /** @type {[typeof PlacesAbout, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PlacesAbout, new PlacesAbout({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    href: "javascript:void(0)",
    ...{ class: "close" },
});
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PlacesAbout: PlacesAbout,
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
//# sourceMappingURL=PlacesPopupText.vue.js.map
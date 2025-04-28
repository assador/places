import { ref, watch, inject } from 'vue';
import { useMainStore } from '@/stores/main';
;
const mainStore = useMainStore();
const lang = ref(mainStore.lang);
const colortheme = ref(mainStore.colortheme);
const colorthemes = inject('colorthemes');
watch(() => lang.value, () => {
    mainStore.changeLang(lang.value);
});
watch(() => colortheme.value, () => {
    mainStore.colortheme = colortheme.value;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "dashboard",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "langs",
    value: (__VLS_ctx.lang),
});
for (const [l, i] of __VLS_getVForSourceType((__VLS_ctx.mainStore.langs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (i),
        value: (l.value),
    });
    (l.title);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "colorthemes",
    value: (__VLS_ctx.colortheme),
});
for (const [c, i] of __VLS_getVForSourceType((__VLS_ctx.colorthemes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (i),
        value: (c.value),
    });
    (c.title);
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            mainStore: mainStore,
            lang: lang,
            colortheme: colortheme,
            colorthemes: colorthemes,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesDashboard.vue.js.map
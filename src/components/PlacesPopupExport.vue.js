import { ref, inject, onMounted, onBeforeUnmount } from 'vue';
import { useMainStore } from '@/stores/main';
;
import { useRouter, useRoute } from 'vue-router';
import PlacesTree from './PlacesTree.vue';
import { constants } from '../shared/constants';
/*
const props = withDefaults(defineProps<IPlacesPopupExportProps>(), {
    mime: 'application/json',
});
*/
const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();
const popuped = ref(false);
const selectedToExport = inject('selectedToExport');
const exportPlaces = inject('exportPlaces');
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event) => {
    switch (constants.shortcuts[event.code]) {
        case 'close':
            close(event);
            break;
    }
};
onMounted(() => {
    window.setTimeout(() => {
        popuped.value = true;
    }, 1);
    for (const f of document.getElementById('popup-export__tree')
        .getElementsByClassName('folder')) {
        f.classList.add('folder_closed');
        f.classList.remove('folder_opened');
    }
    document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
    document.removeEventListener('keyup', keyup, false);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
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
(__VLS_ctx.mainStore.t.i.captions.exportPlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.text.specifyFormatToExport);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onClick: (e => {
            e.stopPropagation();
            __VLS_ctx.mainStore.idleTime = 0;
        }) },
    ...{ onSubmit: (e => __VLS_ctx.exportPlaces(__VLS_ctx.selectedToExport, e.target.elements['mime'].value)) },
    ...{ class: "popup-export__form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({
    ...{ class: "margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    name: "mime",
    type: "radio",
    checked: (true),
    value: "application/gpx+xml",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.text.descGpx);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    name: "mime",
    type: "radio",
    value: "application/json",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.text.descJson);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.text.specifyPlacesToExport);
if (Object.keys(__VLS_ctx.mainStore.places).length > 0 ||
    Object.keys(__VLS_ctx.mainStore.folders).length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (e => e.stopPropagation()) },
        id: "popup-export__tree",
        ...{ class: "menu" },
    });
    /** @type {[typeof PlacesTree, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PlacesTree, new PlacesTree({
        instanceid: "popupexporttree",
        data: (__VLS_ctx.mainStore.tree || {}),
    }));
    const __VLS_1 = __VLS_0({
        instanceid: "popupexporttree",
        data: (__VLS_ctx.mainStore.tree || {}),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.export);
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
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-export__form']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['menu']} */ ;
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PlacesTree: PlacesTree,
            mainStore: mainStore,
            popuped: popuped,
            selectedToExport: selectedToExport,
            exportPlaces: exportPlaces,
            close: close,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesPopupExport.vue.js.map
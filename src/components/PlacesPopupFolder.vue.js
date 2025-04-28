import { ref, computed, onMounted, onBeforeUnmount, onUpdated, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
;
import { useRouter, useRoute } from 'vue-router';
import { constants } from '../shared/constants';
import { generateRandomString } from '../shared/common';
import { makeFieldsValidatable } from '../shared/fields_validate';
const folderName = ref('');
const folderDescription = ref('');
const message = ref('');
const popuped = ref(false);
const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();
const currentPlace = computed(() => mainStore.currentPlace);
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event) => {
    if (constants.shortcuts[event.code] === 'close')
        close(event);
};
const appendFolder = (name, description) => {
    const treeFlat = mainStore.treeFlat;
    if (mainStore.serverConfig.rights.folderscount < 0 ||
        mainStore.serverConfig.rights.folderscount > Object.keys(treeFlat).length - 1 ||
        // length - 1 because there is a root folder too
        mainStore.user.testaccount) {
        let srt = 1;
        if (Object.keys(treeFlat[currentPlace.value ? currentPlace.value.folderid : 'root'].children || []).length) {
            srt = Math.ceil(Math.max(...Object.keys(treeFlat[currentPlace.value ? currentPlace.value.folderid : 'root'].children).map((id) => treeFlat[currentPlace.value ? currentPlace.value.folderid : 'root'].children[id].srt))) + 1;
        }
        const newFolder = {
            id: generateRandomString(32),
            parent: currentPlace.value
                ? currentPlace.value.folderid
                : 'root',
            name: name,
            description: description,
            srt: Number(srt) || 0,
            geomarks: 1,
            builded: false,
            type: 'folder',
            added: true,
            deleted: false,
            updated: false,
            opened: false,
            userid: sessionStorage.getItem('places-userid'),
        };
        mainStore.addFolder({ folder: newFolder });
        message.value = mainStore.t.m.paged.folderCreated;
        folderName.value = '';
        folderDescription.value = '';
        document.getElementById('folderName').focus();
    }
    else {
        message.value = mainStore.t.m.paged.foldersCountExceeded;
    }
};
onMounted(async () => {
    popuped.value = true;
    await nextTick();
    makeFieldsValidatable(mainStore.t);
    document.getElementById('folderName').focus();
    document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
    document.removeEventListener('keyup', keyup, false);
});
onUpdated(() => {
    makeFieldsValidatable(mainStore.t);
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
(__VLS_ctx.mainStore.t.i.captions.newFolder);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onClick: (e => e.stopPropagation()) },
    ...{ onSubmit: (...[$event]) => {
            __VLS_ctx.appendFolder(__VLS_ctx.folderName ? __VLS_ctx.folderName : '', __VLS_ctx.folderDescription ? __VLS_ctx.folderDescription : '');
            ;
        } },
    ...{ class: "folder-new__form margin_bottom_0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "table_form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.captions.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "folderName",
    value: (__VLS_ctx.folderName),
    ...{ class: "fieldwidth_100" },
    required: true,
    type: "text",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
(__VLS_ctx.mainStore.t.i.captions.description);
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    id: "folderDescription",
    value: (__VLS_ctx.folderDescription),
    ...{ class: "fieldwidth_100" },
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
(__VLS_ctx.mainStore.t.i.buttons.createFolder);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
});
(__VLS_ctx.mainStore.t.i.buttons.cancel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
    ...{ class: "back_0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
    ...{ style: {} },
});
(__VLS_ctx.message);
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    href: "javascript:void(0)",
    ...{ class: "close" },
});
/** @type {__VLS_StyleScopedClasses['popup-content']} */ ;
/** @type {__VLS_StyleScopedClasses['centered']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['folder-new__form']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['table_form']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['back_0']} */ ;
/** @type {__VLS_StyleScopedClasses['back_0']} */ ;
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            folderName: folderName,
            folderDescription: folderDescription,
            message: message,
            popuped: popuped,
            mainStore: mainStore,
            close: close,
            appendFolder: appendFolder,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesPopupFolder.vue.js.map
import { ref, computed, watch, onMounted, onBeforeUnmount, onBeforeUpdate, } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMainStore } from '@/stores/main';
;
import { emitter } from '../shared/bus';
import { constants } from '../shared/constants';
const props = withDefaults(defineProps(), {
    folderId: '',
});
const keepContent = ref('keep');
const popuped = ref(false);
const folder = ref({});
const places = ref({});
const folders = ref({});
const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();
const currentPlace = computed(() => mainStore.currentPlace);
const open = (event) => {
    if (event)
        event.stopPropagation();
    folder.value = mainStore.treeFlat[props.folderId];
    if (!folder.value) {
        router.back();
    }
};
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event) => {
    if (constants.shortcuts[event.code] === 'close')
        close(event);
};
const markNestedAsDeleted = (folderCont) => {
    // Mark places and folders in the currently deleted folder as deleted
    for (const id in mainStore.places) {
        if (mainStore.places[id].folderid === folderCont.id) {
            mainStore.places[id].deleted = true;
            places.value[id] = mainStore.places[id];
        }
    }
    if (folderCont.children) {
        for (const id in folderCont.children) {
            folderCont.children[id].deleted = true;
            folders.value[id] = folderCont.children[id];
            markNestedAsDeleted(folderCont.children[id]);
        }
    }
};
const deleteFolder = async (event) => {
    if (keepContent.value === 'delete') {
        markNestedAsDeleted(folder.value);
        if (mainStore.homePlace && mainStore.homePlace.deleted) {
            await mainStore.setHomePlace(null);
        }
        if (currentPlace.value && currentPlace.value.deleted) {
            if (Object.keys(mainStore.places).length) {
                if (mainStore.homePlace && !mainStore.homePlace.deleted) {
                    emitter.emit('choosePlace', { place: mainStore.homePlace });
                }
                else {
                    let firstPlaceInRoot;
                    for (const id in mainStore.places) {
                        if (mainStore.places[id].folderid === 'root') {
                            if (firstPlaceInRoot) {
                                if (mainStore.places[id].srt < firstPlaceInRoot.srt) {
                                    firstPlaceInRoot = mainStore.places[id];
                                }
                            }
                            else {
                                firstPlaceInRoot = mainStore.places[id];
                            }
                        }
                    }
                    if (firstPlaceInRoot && !firstPlaceInRoot.deleted) {
                        emitter.emit('choosePlace', { place: firstPlaceInRoot });
                    }
                    else if (!mainStore.places[Object.keys(mainStore.places)[0]].deleted) {
                        emitter.emit('choosePlace', { place: mainStore.places[Object.keys(mainStore.places)[0]] });
                    }
                    else {
                        emitter.emit('choosePlace', { place: null });
                    }
                }
            }
            else {
                emitter.emit('choosePlace', { place: null });
            }
        }
        await mainStore.deletePlaces({ places: places.value });
        await mainStore.deleteFolders({ folders: folders.value });
    }
    else if (keepContent.value === 'keep') {
        // Move subplaces and subfolders to the root
        for (const id in mainStore.places) {
            if (mainStore.places[id].folderid === folder.value.id) {
                await mainStore.changePlace({
                    place: mainStore.places[id],
                    change: {
                        folderid: 'root',
                        updated: true,
                    },
                });
                places.value[id] = mainStore.places[id];
            }
        }
        if (folder.value.children) {
            while (Object.keys(folder.value.children).length) {
                folders.value[Object.keys(folder.value.children)[0]] =
                    folder.value.children[Object.keys(folder.value.children)[0]];
                mainStore.moveFolder({
                    folder: folder.value.children[Object.keys(folder.value.children)[0]],
                    targetId: 'root',
                    todb: false,
                });
            }
        }
        if (!mainStore.inUndoRedo) {
            emitter.emit('toDB', {
                what: 'places',
                data: Object.values(places.value),
            });
            emitter.emit('toDB', {
                what: 'folders',
                data: Object.values(folders.value),
            });
        }
        else {
            emitter.emit('toDBCompletely');
            mainStore.inUndoRedo = false;
        }
    }
    mainStore.deleteFolders({ folders: { [folder.value.id]: folder.value } });
    close(event);
};
watch(() => props.folderId, () => {
    open();
});
onMounted(() => {
    open();
    document.addEventListener('keyup', keyup, false);
});
onBeforeUpdate(() => {
    window.setTimeout(() => {
        popuped.value = true;
    }, 1);
});
onBeforeUnmount(() => {
    document.removeEventListener('keyup', keyup, false);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    folderId: '',
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
(__VLS_ctx.mainStore.t.i.captions.deletingFolder);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.folder ? __VLS_ctx.folder.name : '');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.text.whatToDoWithFolder);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onClick: (e => e.stopPropagation()) },
    ...{ onSubmit: (e => __VLS_ctx.deleteFolder(e)) },
    ...{ class: "folder-delete__form margin_bottom_0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({
    ...{ class: "margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    name: "content",
    type: "radio",
    value: "keep",
});
(__VLS_ctx.keepContent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.leaveContentInRoot);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    name: "content",
    type: "radio",
    value: "delete",
});
(__VLS_ctx.keepContent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.deleteContent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.deleteFolder);
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
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['folder-delete__form']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            keepContent: keepContent,
            popuped: popuped,
            folder: folder,
            mainStore: mainStore,
            close: close,
            deleteFolder: deleteFolder,
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
//# sourceMappingURL=PlacesPopupFolderDelete.vue.js.map
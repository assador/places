import _ from 'lodash';
import { inject, computed } from 'vue';
import { emitter } from '../shared/bus';
import { useMainStore } from '@/stores/main';
;
import { useRouter } from 'vue-router';
import { formFoldersCheckedIds } from '../shared/common';
export default await (async () => {
    const props = withDefaults(defineProps(), {
        instanceid: null,
        folder: null,
        parent: null,
    });
    const mainStore = useMainStore();
    const router = useRouter();
    const selectedToExport = inject('selectedToExport');
    const foldersCheckedIds = inject('foldersCheckedIds');
    const foldersEditMode = inject('foldersEditMode');
    const handleDragStart = inject('handleDragStart');
    const handleDragEnter = inject('handleDragEnter');
    const handleDragLeave = inject('handleDragLeave');
    const handleDrop = inject('handleDrop');
    const currentPlace = computed(() => mainStore.currentPlace);
    const children = computed(() => _.sortBy(props.folder.children, 'srt'));
    const places = computed(() => _.chain(mainStore.places)
        .filter(p => p.folderid === props.folder.id && p.show)
        .sortBy('srt')
        .value());
    const choosePlace = (place, e) => {
        emitter.emit('choosePlace', {
            place: place,
            mode: (mainStore.mode === 'measure' && e.type === 'contextmenu'
                ? 'measure' : 'normal'),
        });
    };
    const selectUnselect = (place, checked) => {
        if (checked) {
            selectedToExport.value[place.id] = place;
        }
        else {
            delete selectedToExport.value[place.id];
        }
    };
    const selectUnselectFolder = (folderid, checked) => {
        for (const placeButton of document.getElementById('to-export-places-menu-folder-' + folderid)
            .getElementsByClassName('place-button')) {
            if (checked != placeButton.getElementsByClassName('to-export-place-checkbox')[0].checked) {
                placeButton.click();
            }
        }
        for (const folderCheckbox of document.getElementById('to-export-places-menu-folder-' + folderid)
            .getElementsByClassName('folder-checkbox')) {
            folderCheckbox.checked = checked ? true : false;
        }
    };
    debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
    const __VLS_withDefaultsArg = (function (t) { return t; })({
        instanceid: null,
        folder: null,
        parent: null,
    });
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        id: ((__VLS_ctx.instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-' + __VLS_ctx.folder.id),
        srt: (__VLS_ctx.folder.srt),
        title: (__VLS_ctx.folder.description),
        ...{ class: ('folder ' + (__VLS_ctx.folder.opened ? 'folder_opened' : 'folder_closed')) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ('folder-subs' + (__VLS_ctx.instanceid === 'popupexporttree' ? ' has-checks-radios' : '')) },
    });
    if (__VLS_ctx.instanceid === 'popupexporttree') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (e => __VLS_ctx.selectUnselectFolder(__VLS_ctx.folder.id, e.target.checked)) },
            id: ('to-export-places-menu-folder-checkbox-' + __VLS_ctx.folder.id),
            name: "folderCheckbox",
            type: "checkbox",
            ...{ class: "folder-checkbox" },
            checked: (__VLS_ctx.foldersCheckedIds.includes(__VLS_ctx.folder.id)),
        });
    }
    if (!__VLS_ctx.foldersEditMode ||
        props.instanceid === 'popupexporttree' ||
        __VLS_ctx.folder.id === 'root') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ onClick: (e => { __VLS_ctx.mainStore.folderOpenClose(__VLS_ctx.instanceid === 'popupexporttree' ? { target: e.target.parentNode.parentNode } : { folder: __VLS_ctx.folder, opened: !__VLS_ctx.folder.opened }); }) },
            ...{ onDragstart: (__VLS_ctx.handleDragStart) },
            ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
            ...{ onDragleave: (__VLS_ctx.handleDragLeave) },
            ...{ onDrop: (__VLS_ctx.handleDrop) },
            id: ((__VLS_ctx.instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + __VLS_ctx.folder.id),
            'data-folder-button': true,
            href: "javascript: void(0);",
            ...{ class: "folder-button" },
            draggable: (true),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "folder-button__text" },
        });
        (__VLS_ctx.folder.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (e => {
                    e.stopPropagation();
                    __VLS_ctx.mainStore.showHideGeomarks({
                        object: (__VLS_ctx.folder.id === 'root' ? __VLS_ctx.mainStore.tree : __VLS_ctx.folder),
                        show: (__VLS_ctx.folder.geomarks === 1 ? 0 : 1),
                    });
                }) },
            ...{ class: "folder-button__geomarks" },
            title: ((__VLS_ctx.folder.geomarks === 1 ? __VLS_ctx.mainStore.t.i.hints.hide : __VLS_ctx.mainStore.t.i.hints.show) + ' ' + __VLS_ctx.mainStore.t.i.hints.placemarksOnMap),
        });
        (!__VLS_ctx.folder.geomarks ? '⚇' : (__VLS_ctx.folder.geomarks === 1 ? '⚉' : '⚈'));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            id: ((__VLS_ctx.instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + __VLS_ctx.folder.id),
            ...{ class: "folder-button" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (e => { __VLS_ctx.mainStore.changeFolder({ folder: __VLS_ctx.folder, change: { name: e.target.value } }); }) },
            ...{ onClick: (e => { e.stopPropagation(); __VLS_ctx.mainStore.idleTime = 0; }) },
            value: (__VLS_ctx.folder.name),
            placeholder: (__VLS_ctx.mainStore.t.i.captions.name),
            ...{ class: "folder-button__name fieldwidth_100" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ onClick: (e => {
                    e.stopPropagation();
                    __VLS_ctx.router.push({ name: 'PlacesHomeDeleteFolder', params: { folderId: __VLS_ctx.folder.id } })
                        .catch(err => { console.error(err); });
                }) },
            ...{ class: "folder-button__delete" },
            title: (__VLS_ctx.mainStore.t.i.buttons.deleteFolder),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            ...{ onChange: (e => { __VLS_ctx.mainStore.changeFolder({ folder: __VLS_ctx.folder, change: { description: e.target.value } }); }) },
            ...{ onClick: (e => { e.stopPropagation(); __VLS_ctx.mainStore.idleTime = 0; }) },
            value: (__VLS_ctx.folder.description),
            rows: "2",
            placeholder: (__VLS_ctx.mainStore.t.i.captions.description),
            ...{ class: "folder-button__description fieldwidth_100" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "folder-subfolders" },
    });
    if (__VLS_ctx.folder.children && Object.keys(__VLS_ctx.folder.children).length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ class: "margin_bottom_0" },
        });
        for (const [child] of __VLS_getVForSourceType((__VLS_ctx.children))) {
            const __VLS_0 = {}.PlacesFolder;
            /** @type {[typeof __VLS_components.PlacesFolder, typeof __VLS_components.placesFolder, ]} */ ;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
                key: (child.id),
                instanceid: (__VLS_ctx.instanceid),
                folder: (child),
                parent: (__VLS_ctx.folder),
            }));
            const __VLS_2 = __VLS_1({
                key: (child.id),
                instanceid: (__VLS_ctx.instanceid),
                folder: (child),
                parent: (__VLS_ctx.folder),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: ((__VLS_ctx.instanceid === 'popupexporttree' ? 'to-export-folder-' : '') + __VLS_ctx.folder.id),
        ...{ class: "folder-places" },
    });
    for (const [place] of __VLS_getVForSourceType((__VLS_ctx.places))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ onClick: (e => {
                    __VLS_ctx.instanceid !== 'popupexporttree' ? __VLS_ctx.choosePlace(place, e) : '';
                }) },
            ...{ onContextmenu: (e => {
                    e.preventDefault();
                    __VLS_ctx.instanceid !== 'popupexporttree' ? __VLS_ctx.choosePlace(place, e) : '';
                }) },
            ...{ onDragstart: (__VLS_ctx.handleDragStart) },
            id: ((__VLS_ctx.instanceid === 'popupexporttree' ? 'to-export-place-' : '') + place.id),
            key: (place.id),
            srt: (place.srt),
            title: (place.description),
            ...{ class: ('place-button block_01 draggable has-checks-radios' +
                    (__VLS_ctx.currentPlace && place.id == __VLS_ctx.currentPlace.id ? ' active' : '') +
                    (__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(place.id) ? ' chosen' : '')) },
            draggable: (true),
            'data-place-button': true,
        });
        if (__VLS_ctx.instanceid === 'popupexporttree') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (e => {
                        __VLS_ctx.selectUnselect(place, e.target.checked);
                        __VLS_ctx.foldersCheckedIds = __VLS_ctx.formFoldersCheckedIds();
                    }) },
                id: ('to-export-place-checkbox-' + place.id),
                name: "placeCheckbox",
                type: "checkbox",
                ...{ class: "to-export-place-checkbox folder-checkbox" },
                checked: (__VLS_ctx.selectedToExport.hasOwnProperty(place.id)),
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "place-button__text" },
        });
        (place.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ onClick: (e => {
                    e.stopPropagation();
                    __VLS_ctx.mainStore.showHideGeomarks({
                        object: place,
                        show: !place.geomark,
                    });
                }) },
            ...{ class: "place-button__geomark" },
            title: ((!place.geomark ? __VLS_ctx.mainStore.t.i.hints.show : __VLS_ctx.mainStore.t.i.hints.hide) + ' ' + __VLS_ctx.mainStore.t.i.hints.placemarkOnMap),
        });
        (!place.geomark ? '⚇' : '⚉');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
            ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
            ...{ onDragleave: (__VLS_ctx.handleDragLeave) },
            'data-place-button-dragenter-area-top': true,
            ...{ class: "dragenter-area dragenter-area_top" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
            ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
            ...{ onDragleave: (__VLS_ctx.handleDragLeave) },
            'data-place-button-dragenter-area-bottom': true,
            ...{ class: "dragenter-area dragenter-area_bottom" },
        });
    }
    if (__VLS_ctx.folder.id !== 'root') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
            ...{ onDragleave: (__VLS_ctx.handleDragLeave) },
            'data-folder-dragenter-area-top': true,
            ...{ class: "dragenter-area dragenter-area_top" },
        });
    }
    if (__VLS_ctx.folder.id !== 'root') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
            ...{ onDragleave: (__VLS_ctx.handleDragLeave) },
            'data-folder-dragenter-area-bottom': true,
            ...{ class: "dragenter-area dragenter-area_bottom" },
        });
    }
    /** @type {__VLS_StyleScopedClasses['folder-checkbox']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button__text']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button__geomarks']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button__name']} */ ;
    /** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button__delete']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-button__description']} */ ;
    /** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-subfolders']} */ ;
    /** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-places']} */ ;
    /** @type {__VLS_StyleScopedClasses['to-export-place-checkbox']} */ ;
    /** @type {__VLS_StyleScopedClasses['folder-checkbox']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-button__text']} */ ;
    /** @type {__VLS_StyleScopedClasses['place-button__geomark']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area_top']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area_bottom']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area_top']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area']} */ ;
    /** @type {__VLS_StyleScopedClasses['dragenter-area_bottom']} */ ;
    var __VLS_dollars;
    const __VLS_self = (await import('vue')).defineComponent({
        setup() {
            return {
                formFoldersCheckedIds: formFoldersCheckedIds,
                mainStore: mainStore,
                router: router,
                selectedToExport: selectedToExport,
                foldersCheckedIds: foldersCheckedIds,
                foldersEditMode: foldersEditMode,
                handleDragStart: handleDragStart,
                handleDragEnter: handleDragEnter,
                handleDragLeave: handleDragLeave,
                handleDrop: handleDrop,
                currentPlace: currentPlace,
                children: children,
                places: places,
                choosePlace: choosePlace,
                selectUnselect: selectUnselect,
                selectUnselectFolder: selectUnselectFolder,
            };
        },
        __typeProps: {},
        props: {},
        name: 'PlacesFolder',
    });
    return (await import('vue')).defineComponent({
        setup() {
            return {};
        },
        __typeProps: {},
        props: {},
        name: 'PlacesFolder',
    });
})();
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesTreeNode.vue.js.map
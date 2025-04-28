import { ref, computed, watch, onMounted, onBeforeUnmount, onUpdated, provide, inject, nextTick, defineAsyncComponent, watchEffect, } from 'vue';
import axios from 'axios';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import _ from 'lodash';
import { constants } from '@/shared/constants';
import { generateRandomString, sortObjects, coords2string, string2coords, } from '@/shared/common';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { emitter } from '@/shared/bus';
import PlacesDashboard from './PlacesDashboard.vue';
import PlacesTree from './PlacesTree.vue';
import PlacesPopupConfirm from './PlacesPopupConfirm.vue';
const mainStore = useMainStore();
const router = useRouter();
const idleTimeInterval = inject('idleTimeInterval');
const currentPlaceCommon = inject('currentPlaceCommon');
const foldersEditMode = inject('foldersEditMode');
const toDB = inject('toDB');
const toDBCompletely = inject('toDBCompletely');
const deleteImages = inject('deleteImages');
const handleDragStart = inject('handleDragStart');
const handleDragEnter = inject('handleDragEnter');
const handleDragOver = inject('handleDragOver');
const handleDrop = inject('handleDrop');
const maps = [
    {
        name: 'OpenStreetMap',
        component: defineAsyncComponent(() => import('./PlacesMapOpenStreetMap.vue')),
        componentName: 'PlacesMapOpenStreetMap',
    }, {
        name: 'Яндекс.Карты',
        component: defineAsyncComponent(() => import('./PlacesMapYandex.vue')),
        componentName: 'PlacesMapYandex',
    }
];
const root = ref(null);
const basicOnFull = () => {
    root.value.classList.toggle('basic-fulled');
};
const extmap = ref(null);
provide('extmap', extmap);
const inputImportFromFile = ref(null);
const inputUploadFiles = ref(null);
const commonPlacesPage = ref(1);
provide('commonPlacesPage', commonPlacesPage);
const commonPlacesPagesCount = ref(0);
const commonPlacesOnPageCount = ref(constants.commonplacesonpagecount);
provide('commonPlacesOnPageCount', commonPlacesOnPageCount);
const commonPlacesShow = ref(false);
const sidebarSize = ref({
    top: constants.sidebars.top,
    right: constants.sidebars.right,
    bottom: constants.sidebars.bottom,
    left: constants.sidebars.left,
});
const sidebarDrag = ref({ what: null, x: 0, y: 0, w: 0, h: 0 });
const sbs = ref('all');
const compact = ref(0);
watch(compact, () => {
    let sidebars = constants.sidebars;
    switch (compact.value) {
        case 0:
            sidebars = constants.sidebars;
            break;
        case 1:
            sidebars = constants.sidebarsCompact;
            break;
        default:
            sidebars = constants.sidebarsCompactUltra;
            break;
    }
    sidebarSize.value.top = sidebars.top;
    sidebarSize.value.right = sidebars.right;
    sidebarSize.value.bottom = sidebars.bottom;
    sidebarSize.value.left = sidebars.left;
});
const gridStyle = computed(() => `
	grid-template-rows:
	${sidebarSize.value.top}px 1fr ${sidebarSize.value.bottom}px;
	grid-template-columns:
	${sidebarSize.value.left}px 1fr ${sidebarSize.value.right}px;
`);
const linkEditing = ref(false);
const orderedCurrentPlaceFields = ref([
    'name',
    'description',
    'waypoint',
    'link',
    'time',
    'srt',
    'common',
    'images',
]);
const currentPlace = computed(() => mainStore.currentPlace);
const waypoints = computed(() => mainStore.waypoints);
const commonPlaces = computed(() => {
    const places = {};
    for (const id in mainStore.commonPlaces) {
        if (Object.keys(mainStore.commonPlaces).indexOf(id) >=
            commonPlacesOnPageCount.value * (commonPlacesPage.value - 1) &&
            Object.keys(mainStore.commonPlaces).indexOf(id) <
                commonPlacesOnPageCount.value * commonPlacesPage.value) {
            places[id] = mainStore.commonPlaces[id];
        }
    }
    return places;
});
const orderedImages = computed(() => {
    return (currentPlace.value
        ? _.orderBy(currentPlace.value.images, 'srt')
        : []);
});
const currentPlaceLat = computed(() => {
    return waypoints.value[currentPlace.value.waypoint].latitude;
});
const currentPlaceLon = computed(() => {
    return waypoints.value[currentPlace.value.waypoint].longitude;
});
const currentDegMinSec = computed(() => {
    return coords2string([currentPlaceLat.value, currentPlaceLon.value]);
});
const currentPlaceAltitude = ref(null);
const centerAltitude = ref(null);
const getAltitude = async (lat, lon, alt) => {
    axios
        .get(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`)
        .then(response => {
        if (isNaN(Number(response.data.elevation)))
            alt.value = null;
        else
            alt.value = Number(response.data.elevation);
    })
        .catch(() => alt.value = null);
};
watchEffect(() => {
    getAltitude(currentPlaceLat.value, currentPlaceLon.value, currentPlaceAltitude);
});
watchEffect(() => {
    getAltitude(mainStore.center.latitude, mainStore.center.longitude, centerAltitude);
});
watch(() => mainStore.ready, () => {
    stateReadyChanged();
});
watch(mainStore, changedStore => {
    if (!changedStore.refreshing) {
        sessionStorage.setItem('places-store-state', JSON.stringify(changedStore.$state));
    }
});
watch(mainStore.measure.places, () => mainStore.measureDistance());
watch(mainStore.waypoints, () => mainStore.measureDistance());
emitter.on('choosePlace', (payload) => {
    choosePlace(payload);
});
emitter.on('deletePlace', (place) => {
    deletePlace(place);
});
const confirmPopup = ref(false);
provide('confirmPopup', confirmPopup);
const confirmCallback = ref(null);
const confirmCallbackArgs = ref(null);
const confirm = (func, args) => {
    confirmPopup.value = true;
    confirmCallback.value = func;
    confirmCallbackArgs.value = args;
    return true;
};
onMounted(async () => {
    if (mainStore.ready)
        stateReadyChanged();
    mainStore.idleTime = 0;
    if (!idleTimeInterval.value) {
        idleTimeInterval.value =
            window.setInterval(() => {
                if (mainStore.idleTime < constants.sessionlifetime) {
                    mainStore.idleTime++;
                }
                else {
                    window.clearInterval(idleTimeInterval.value);
                    idleTimeInterval.value = undefined;
                    mainStore.unload();
                    router.push({ name: 'PlacesAuth' });
                }
            }, 1000);
    }
    await nextTick();
    makeFieldsValidatable(mainStore.t);
    getAltitude(currentPlaceLat.value, currentPlaceLon.value, currentPlaceAltitude);
});
onBeforeUnmount(() => {
    document.removeEventListener('dragover', handleDragOver, false);
    document.removeEventListener('drop', handleDrop, false);
    document.removeEventListener('keyup', keyup, false);
    emitter.off('choosePlace');
    window.clearInterval(idleTimeInterval.value);
});
onUpdated(() => makeFieldsValidatable(mainStore.t));
const installEvent = inject('installEvent');
const installButtonEnabled = ref(false);
watch(() => installEvent.value, () => {
    installButtonEnabled.value = !!installEvent.value;
});
const dismissPrompt = () => {
    installButtonEnabled.value = false;
};
const installPWA = () => {
    installEvent.value.prompt();
    installEvent.value.userChoice.then(choice => {
        dismissPrompt();
        if (choice.outcome === 'accepted') {
        }
        else {
        }
    });
};
const blur = (el) => {
    if (el) {
        try {
            el.blur();
        }
        finally { }
    }
    else {
        const els = document.querySelectorAll(':focus');
        for (const el of els) {
            try {
                el.blur();
            }
            finally { }
        }
    }
};
const exit = () => {
    router.push({ name: 'PlacesAuth' });
    sessionStorage.clear();
};
const stateReadyChanged = () => {
    if (!mainStore.ready)
        return;
    mainStore.restoreObjectsAsLinks();
    if (!currentPlace.value)
        mainStore.setFirstCurrentPlace();
    openTreeToCurrentPlace();
    commonPlacesPagesCount.value = Math.ceil(Object.keys(mainStore.commonPlaces).length /
        commonPlacesOnPageCount.value);
    currentPlaceCommon.value = false;
    if (currentPlace.value &&
        currentPlace.value.common &&
        currentPlace.value.userid !== mainStore.user.id) {
        const inPaginator = Object.keys(mainStore.commonPlaces).indexOf(currentPlace.value.id) /
            commonPlacesOnPageCount.value;
        commonPlacesPage.value = (Number.isInteger(inPaginator)
            ? inPaginator + 1
            : Math.ceil(inPaginator));
        currentPlaceCommon.value = true;
    }
    document.addEventListener('dragover', handleDragOver, false);
    document.addEventListener('drop', handleDrop, false);
    document.addEventListener('keyup', keyup, false);
    window.addEventListener('resize', windowResize, false);
    if (mainStore.user.testaccount) {
        window.setTimeout(() => {
            mainStore.setMessage(mainStore.t.m.popup.testAccount);
        }, 3000);
    }
    windowResize();
};
const openTreeToCurrentPlace = () => {
    if (currentPlaceCommon.value || !currentPlace.value)
        return;
    let folder, folderid = currentPlace.value.folderid;
    while (folderid) {
        folder = mainStore.treeFlat[folderid];
        if (!folder)
            break;
        mainStore.folderOpenClose({
            folder: folder,
            opened: true,
        });
        folderid = folder.parent;
    }
};
const choosePlace = (payload) => {
    if (!payload.place) {
        mainStore.currentPlace = null;
        return;
    }
    switch (mainStore.mode) {
        case 'measure':
            if (payload.mode && payload.mode === 'measure') {
                const index = mainStore.measure.places.indexOf(payload.place.id);
                if (index === -1) {
                    if (mainStore.measure.choosing === mainStore.measure.places.length) {
                        mainStore.measure.places.push(payload.place.id);
                    }
                    else {
                        (mainStore.measure.places[mainStore.measure.choosing] = payload.place.id);
                    }
                }
                else {
                    mainStore.measure.places.splice(index, 1);
                }
                mainStore.measure.choosing = mainStore.measure.places.length;
            }
        default:
            if (!payload.mode || payload.mode !== 'measure') {
                if (currentPlace.value && payload.place === currentPlace.value)
                    return;
                mainStore.currentPlace = payload.place;
                currentPlaceCommon.value = (currentPlace.value.userid !== mainStore.user.id
                    ? true
                    : false);
                openTreeToCurrentPlace();
                mainStore.updateMap({
                    latitude: mainStore.waypoints[currentPlace.value.waypoint].latitude,
                    longitude: mainStore.waypoints[currentPlace.value.waypoint].longitude,
                });
                break;
            }
    }
};
const appendPlace = async () => {
    if (mainStore.serverConfig.rights.placescount < 0 ||
        mainStore.serverConfig.rights.placescount
            > Object.keys(mainStore.places).length ||
        mainStore.user.testaccount) {
        const newWaypoint = {
            id: generateRandomString(32),
            latitude: mainStore.center.latitude ||
                null,
            longitude: mainStore.center.longitude ||
                null,
            time: new Date().toISOString().slice(0, -5),
            common: false,
            type: 'waypoint',
            added: true,
            deleted: false,
            updated: false,
            show: true,
        };
        const newPlace = {
            type: 'place',
            userid: sessionStorage.getItem('places-userid'),
            name: '',
            description: '',
            waypoint: newWaypoint.id,
            link: '',
            time: new Date().toISOString().slice(0, -5),
            id: generateRandomString(32),
            folderid: currentPlace.value && !currentPlace.value.common
                ? currentPlace.value.folderid
                : 'root',
            srt: Number(Object.keys(mainStore.places).length > 0
                ? Math.ceil(Math.max(...Object.values(mainStore.places).map((place) => place.srt))) + 1
                : 1) || 0,
            common: false,
            geomark: true,
            images: {},
            added: true,
            deleted: false,
            updated: false,
            show: true,
        };
        await mainStore.addPlace({ place: newPlace });
        mainStore.addWaypoint({ waypoint: newWaypoint, from: newPlace });
        choosePlace({ place: newPlace });
        await nextTick();
        document.getElementById('detailed-name').classList.add('highlight');
        window.setTimeout(function () {
            document.getElementById('detailed-name').classList.remove('highlight');
            document.getElementById('detailed-name').focus();
        }, 500);
        return newPlace;
    }
    else {
        mainStore.setMessage(mainStore.t.m.popup.placesCountExceeded);
    }
};
const deletePlace = (place) => {
    if (place === currentPlace.value) {
        // Set current place
        if (Object.keys(mainStore.places).length > 1) {
            if (document.getElementById(place.id).nextElementSibling) {
                choosePlace({ place: mainStore.places[document.getElementById(place.id).nextElementSibling.id] });
            }
            else if (document.getElementById(place.id).previousElementSibling) {
                choosePlace({ place: mainStore.places[document.getElementById(place.id).previousElementSibling.id] });
            }
            else if (mainStore.homePlace &&
                mainStore.homePlace !== place) {
                choosePlace({ place: mainStore.homePlace });
            }
            else {
                let firstPlaceInRoot, inRoot = false;
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
                        inRoot = true;
                    }
                }
                if (inRoot) {
                    choosePlace({ place: firstPlaceInRoot });
                }
                else {
                    choosePlace({ place: mainStore.places[Object.keys(mainStore.places)[0]] });
                }
            }
        }
        else {
            choosePlace(null);
        }
    }
};
const commonPlacesShowHide = (show = null) => {
    commonPlacesShow.value =
        show === null
            ? !commonPlacesShow.value
            : show;
    mainStore.commonPlacemarksShowHide(commonPlacesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);
const importFromFile = () => {
    const mime = inputImportFromFile.value.files[0].type;
    const reader = new FileReader();
    reader.onload = async (event) => {
        await nextTick();
        mainStore.setPlaces({
            text: event.target.result,
            mime: mime,
        });
        inputImportFromFile.value.value = '';
    };
    if (mime === 'application/json' || mime === 'application/gpx+xml') {
        reader.readAsText(inputImportFromFile.value.files[0]);
    }
    else {
        mainStore.setMessage(mainStore.t.m.popup.invalidImportFileType);
    }
};
const uploadFiles = (event) => {
    event.preventDefault();
    if (mainStore.user.testaccount) {
        mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads);
    }
    else {
        const data = new FormData(), files = inputUploadFiles.value.files, filesArray = [];
        let srt;
        if (currentPlace.value.images &&
            Object.keys(currentPlace.value.images).length) {
            const storeImages = Object.values(currentPlace.value.images);
            srt = Number(sortObjects(storeImages, 'srt').pop().srt) || 0;
        }
        else {
            srt = 0;
        }
        for (let i = 0; i < files.length; i++) {
            if (!mainStore.serverConfig.mimes[files[i].type]) {
                mainStore.setMessage(mainStore.t.m.popup.file + ' ' +
                    files[i].name +
                    ' ' + mainStore.t.m.popup.fileNotImage);
            }
            else if (files[i].size > mainStore.serverConfig.uploadsize) {
                mainStore.setMessage(mainStore.t.m.popup.file + ' ' +
                    files[i].name +
                    ' ' + mainStore.t.m.popup.fileTooLarge);
            }
            else {
                const rndname = generateRandomString(32);
                data.append(rndname, files[i]);
                filesArray.push({
                    id: rndname,
                    file: rndname +
                        '.' +
                        mainStore.serverConfig.mimes[files[i].type],
                    size: Number(files[i].size) || null,
                    type: files[i].type,
                    lastmodified: Number(files[i].lastModified) || null,
                    srt: ++srt,
                    placeid: currentPlace.value.id
                        ? currentPlace.value.id
                        : null,
                });
            }
        }
        if (filesArray.length) {
            document.getElementById('images-uploading').classList.remove('hidden');
            data.append('userid', mainStore.user.id);
            axios.post('/backend/upload.php', data)
                .then(response => {
                document.getElementById('images-add__input').value = '';
                document.getElementById('images-uploading').classList.add('hidden');
                for (let i = 0; i < filesArray.length; i++) {
                    if (!response.data[1].find((f) => f.id === filesArray[i].id)) {
                        filesArray.splice(i, 1);
                        i--;
                    }
                }
                /*
                Проверка накопленных кодов ошибок и замечаний
                в процессе выполнения /dist/backend/upload.php
                */
                response.data[0].forEach((code) => {
                    switch (code) {
                        case 2:
                            mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads);
                            break;
                        case 3:
                            mainStore.setMessage(mainStore.t.m.popup.filesNotImages);
                            break;
                        case 4:
                            mainStore.setMessage(mainStore.t.m.popup.filesTooLarge +
                                ' ' + (Number((mainStore.serverConfig.rights.photosize
                                / 1048576).toFixed(3)) || 0) + ' Mb.');
                            break;
                    }
                });
                if (response.data[1].length > 0) {
                    if (currentPlace.value) {
                        const newImagesObject = Object.assign({}, (currentPlace.value.images
                            ? currentPlace.value.images
                            : {}));
                        for (const image of filesArray) {
                            newImagesObject[image.id] = image;
                        }
                        mainStore.changePlace({
                            place: currentPlace.value,
                            change: { images: newImagesObject },
                        }).then(() => {
                            toDB({
                                what: 'places',
                                data: [currentPlace.value],
                            });
                        });
                    }
                    toDB({
                        what: 'images_upload',
                        data: filesArray,
                    });
                    mainStore.setMessage(mainStore.t.m.popup.filesUploadedSuccessfully);
                }
            })
                .catch(error => {
                mainStore.setMessage(mainStore.t.m.popup.filesUploadError +
                    ' ' + error);
                document.getElementById('images-add__input').value = '';
                document.getElementById('images-uploading').classList.add('hidden');
            });
        }
    }
};
const keyup = (event) => {
    if (event.altKey &&
        event.shiftKey) {
        if (constants.shortcuts[event.code]) {
            blur();
        }
        switch (constants.shortcuts[event.code]) {
            case 'add':
                appendPlace();
                break;
            case 'delete':
                if (currentPlace.value &&
                    currentPlace.value.userid ===
                        mainStore.user.id) {
                    mainStore.deletePlaces({
                        places: { [currentPlace.value.id]: currentPlace.value }
                    });
                }
                break;
            case 'add folder':
                router.push({ name: 'PlacesHomeFolder' });
                break;
            case 'edit mode':
                foldersEditMode.value = !foldersEditMode.value;
                if (document.getElementById('actions-edit-folders')
                    .classList.contains('button-pressed')) {
                    document.getElementById('actions-edit-folders')
                        .classList.remove('button-pressed');
                }
                else {
                    document.getElementById('actions-edit-folders')
                        .classList.add('button-pressed');
                }
                break;
            case 'import':
                inputImportFromFile.value.click();
                break;
            case 'export':
                router.push({
                    name: 'PlacesHomeExport',
                });
                break;
            case 'save':
                toDBCompletely();
                break;
            case 'help':
                router.push({ name: 'PlacesHomeText', params: { what: 'about' } });
                break;
            case 'revert':
                document.location.reload();
                break;
            case 'quit':
                toDBCompletely();
                exit();
                break;
            case 'other':
                commonPlacesShowHide();
                break;
            case 'placemarks':
                mainStore.placemarksShowHide();
                break;
            case 'other placemarks':
                mainStore.commonPlacemarksShowHide();
                break;
            case 'center':
                mainStore.centerPlacemarkShowHide();
                break;
            case 'undo':
                mainStore.undo();
                break;
            case 'redo':
                mainStore.redo();
                break;
        }
    }
};
const sbsTo = (to) => {
    switch (sbs.value) {
        case 'upper':
            if (to === 'up')
                sbs.value = 'all';
            break;
        case 'lower':
            if (to === 'down')
                sbs.value = 'all';
            break;
        case 'all':
        default:
            if (to === 'up')
                sbs.value = 'lower';
            if (to === 'down')
                sbs.value = 'upper';
            break;
    }
};
const windowResize = () => {
    if (window.innerWidth > constants.compact) {
        compact.value = 0;
    }
    else if (window.innerWidth > constants.compactUltra) {
        compact.value = 1;
    }
    else {
        compact.value = 2;
    }
};
const sidebarDragStart = (event, what) => {
    event.preventDefault();
    sidebarDrag.value.what = what;
    if (event.changedTouches) {
        sidebarDrag.value.x = event.changedTouches[0].pageX;
        sidebarDrag.value.y = event.changedTouches[0].pageY;
    }
    else {
        sidebarDrag.value.x = event.screenX;
        sidebarDrag.value.y = event.screenY;
    }
    switch (sidebarDrag.value.what) {
        case 'top':
            sidebarDrag.value.h = sidebarSize.value.top;
            break;
        case 'bottom':
            sidebarDrag.value.h = sidebarSize.value.bottom;
            break;
        case 'left':
            sidebarDrag.value.w = sidebarSize.value.left;
            break;
        case 'right':
            sidebarDrag.value.w = sidebarSize.value.right;
            break;
    }
};
const documentMouseOver = (event) => {
    if (sidebarDrag.value.what === null)
        return;
    switch (sidebarDrag.value.what) {
        case 'top':
            sidebarSize.value.top = (sidebarDrag.value.h - sidebarDrag.value.y +
                (event.changedTouches
                    ? event.changedTouches[0].pageY
                    : event.screenY));
            if (sidebarSize.value.top < constants.sidebars.top) {
                sidebarSize.value.top = 0;
            }
            break;
        case 'bottom':
            sidebarSize.value.bottom =
                sidebarDrag.value.h + sidebarDrag.value.y -
                    (event.changedTouches
                        ? event.changedTouches[0].pageY
                        : event.screenY);
            if (sidebarSize.value.bottom < constants.sidebars.bottom) {
                sidebarSize.value.bottom = 0;
            }
            break;
        case 'left':
            sidebarSize.value.left =
                sidebarDrag.value.w - sidebarDrag.value.x +
                    (event.changedTouches
                        ? event.changedTouches[0].pageX
                        : event.screenX);
            if (sidebarSize.value.left < constants.sidebars.top) {
                sidebarSize.value.left = 0;
            }
            break;
        case 'right':
            sidebarSize.value.right =
                sidebarDrag.value.w + sidebarDrag.value.x -
                    (event.changedTouches
                        ? event.changedTouches[0].pageX
                        : event.screenX);
            if (sidebarSize.value.right < constants.sidebars.top) {
                sidebarSize.value.right = 0;
            }
            break;
    }
};
const sidebarDragStop = () => {
    sidebarDrag.value.what = null;
};
// Search places by name
const rangeInput = ref(null);
const searchInput = ref(null);
const searchInputEvent = (event) => {
    if (event.code === "Escape") {
        event.target.value = '';
    }
    if (event.code === "Escape" ||
        event.code === "Enter") {
        selectPlaces(event.target.value);
    }
};
const selectPlaces = (text) => {
    const regexp = new RegExp(text, 'i');
    const folders = mainStore.treeFlat;
    for (const id in mainStore.places) {
        if (regexp.test(mainStore.places[id].name)) {
            mainStore.places[id].show = true;
            if (text.length !== 0 &&
                !folders[mainStore.places[id].folderid].opened) {
                mainStore.folderOpenClose({
                    folder: folders[mainStore.places[id].folderid],
                    opened: true,
                });
            }
        }
        else {
            mainStore.places[id].show = false;
        }
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['control-search']} */ ;
/** @type {__VLS_StyleScopedClasses['control-measure']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMousemove: (e => __VLS_ctx.documentMouseOver(e)) },
    ...{ onTouchmove: (e => __VLS_ctx.documentMouseOver(e)) },
    ...{ onMouseup: (__VLS_ctx.sidebarDragStop) },
    ...{ onTouchend: (__VLS_ctx.sidebarDragStop) },
    id: "grid",
    ref: "root",
    ...{ class: (`sbs_${__VLS_ctx.sbs}`) },
    ...{ style: (__VLS_ctx.gridStyle) },
});
/** @type {typeof __VLS_ctx.root} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "top-basic",
    ...{ class: "app-cell" },
    ...{ style: (__VLS_ctx.sidebarSize.top === 0 ? 'display: none' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "top-basic-content",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "basiccolor margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.brand.header);
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/account",
}));
const __VLS_2 = __VLS_1({
    to: "/account",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
(__VLS_ctx.mainStore.user ? __VLS_ctx.mainStore.user.login : 'o_O');
var __VLS_3;
if (!!__VLS_ctx.mainStore['user'] &&
    !!__VLS_ctx.mainStore.user['groups'] &&
    !!__VLS_ctx.mainStore.user['groups'].find(g => g.parent === 'management')) {
    const __VLS_4 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        to: "/admin",
        ...{ class: "admin-link" },
    }));
    const __VLS_6 = __VLS_5({
        to: "/admin",
        ...{ class: "admin-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    (__VLS_ctx.mainStore.t.i.captions.admin);
    var __VLS_7;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
(__VLS_ctx.mainStore.t.i.brand.slogan);
/** @type {[typeof PlacesDashboard, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(PlacesDashboard, new PlacesDashboard({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseover: (...[$event]) => {
            __VLS_ctx.mainStore.setMouseOverMessages(true);
        } },
    ...{ onMouseout: (...[$event]) => {
            __VLS_ctx.mainStore.setMouseOverMessages(false);
        } },
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.clearMessages();
            ;
        } },
    id: "messages",
    ...{ class: "invisible" },
});
for (const [message, index] of __VLS_getVForSourceType((__VLS_ctx.mainStore.messages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: ('message-' + index),
        key: (index),
        ...{ class: "message border_1" },
    });
    (__VLS_ctx.mainStore.messages[index]);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "top-right",
    ...{ class: "app-cell" },
    ...{ style: (__VLS_ctx.sidebarSize.top === 0 || __VLS_ctx.sidebarSize.right === 0 ? 'display: none' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-buttons" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.importFromFile();
            ;
        } },
    id: "inputImportFromFile",
    ref: "inputImportFromFile",
    name: "jsonFile",
    type: "file",
    accept: ".json,.gpx,text/xml,application/json",
});
/** @type {typeof __VLS_ctx.inputImportFromFile} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.undo();
            ;
        } },
    id: "actions-undo",
    disabled: (__VLS_ctx.mainStore.stateBackupsIndex < 0),
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.undo),
    accesskey: "z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.undo);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.redo();
            ;
        } },
    id: "actions-redo",
    disabled: (!__VLS_ctx.mainStore.stateBackups ||
        __VLS_ctx.mainStore.stateBackupsIndex >= __VLS_ctx.mainStore.stateBackups.length - 2),
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.redo),
    accesskey: "y",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.redo);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toDBCompletely) },
    id: "actions-save",
    disabled: (__VLS_ctx.mainStore.saved),
    ...{ class: ('actions-button' + (!__VLS_ctx.mainStore.saved ? ' button-pressed' : '')) },
    title: ((!__VLS_ctx.mainStore.saved ? (__VLS_ctx.mainStore.t.i.hints.notSaved + '. ') : '') + __VLS_ctx.mainStore.t.i.hints.sabeToDb),
    accesskey: "s",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.save);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.installPWA) },
    id: "actions-install",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.install),
    disabled: (__VLS_ctx.installButtonEnabled),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.install);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.inputImportFromFile.click();
        } },
    id: "actions-import",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.importPlaces),
    accesskey: "i",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.import);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'PlacesHomeExport' });
        } },
    id: "actions-export",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.exportPlaces),
    accesskey: "e",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.export);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push({
                name: 'PlacesHomeText',
                params: { what: 'about' }
            });
            ;
        } },
    id: "actions-about",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.about),
    accesskey: "h",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.help);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => { __VLS_ctx.toDBCompletely().then(() => __VLS_ctx.exit()); }) },
    id: "actions-exit",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.exit),
    accesskey: "q",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.exit);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "basic-left",
    ...{ class: "app-cell" },
    ...{ style: (__VLS_ctx.sidebarSize.left === 0 ? 'display: none' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-buttons" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appendPlace();
            ;
        } },
    id: "actions-append",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.addPlace),
    accesskey: "a",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.newPlace);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.deletePlaces({ places: { [__VLS_ctx.currentPlace.id]: __VLS_ctx.currentPlace } });
            ;
        } },
    id: "actions-delete",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.deletePlace),
    disabled: (!(__VLS_ctx.mainStore.user && __VLS_ctx.currentPlace && __VLS_ctx.currentPlace.userid === __VLS_ctx.mainStore.user.id)),
    accesskey: "d",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.delete);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'PlacesHomeFolder' }).catch(e => { console.error(e); });
            ;
        } },
    id: "actions-append-folder",
    ...{ class: "actions-button" },
    title: (__VLS_ctx.mainStore.t.i.hints.addFolder),
    accesskey: "f",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.newFolder);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.foldersEditMode = !__VLS_ctx.foldersEditMode;
            ;
        } },
    id: "actions-edit-folders",
    ...{ class: ('actions-button' + (__VLS_ctx.foldersEditMode ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.hints.editFolders),
    accesskey: "c",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.editFolders);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => {
            __VLS_ctx.mainStore.rangeShow = !__VLS_ctx.mainStore.rangeShow;
            __VLS_ctx.mainStore.rangeShow
                ? __VLS_ctx.mainStore.showInRange(__VLS_ctx.mainStore.range)
                : __VLS_ctx.mainStore.showInRange(null);
        }) },
    id: "actions-range",
    ...{ class: ('actions-button' + (__VLS_ctx.mainStore.rangeShow ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.captions.range),
    accesskey: "r",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.range);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => {
            __VLS_ctx.mainStore.measure.show = !__VLS_ctx.mainStore.measure.show;
            __VLS_ctx.mainStore.mode = __VLS_ctx.mainStore.measure.show ? 'measure' : 'normal';
        }) },
    id: "actions-measure",
    ...{ class: ('actions-button' + (__VLS_ctx.mainStore.measure.show ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.captions.measure),
    accesskey: "m",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.measure);
if (__VLS_ctx.mainStore.rangeShow) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (...[$event]) => {
                if (!(__VLS_ctx.mainStore.rangeShow))
                    return;
                __VLS_ctx.mainStore.showInRange(__VLS_ctx.mainStore.range);
            } },
        action: "javascript:void(0)",
        ...{ class: "control-range" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ref: "rangeInput",
        type: "number",
        min: "0",
        max: "6378136.6",
        placeholder: (__VLS_ctx.mainStore.t.i.buttons.range),
        title: (__VLS_ctx.mainStore.t.i.captions.range),
        ...{ class: "fieldwidth_100" },
    });
    (__VLS_ctx.mainStore.range);
    /** @type {typeof __VLS_ctx.rangeInput} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mainStore.rangeShow))
                    return;
                __VLS_ctx.mainStore.showInRange(__VLS_ctx.mainStore.range);
            } },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mainStore.rangeShow))
                    return;
                if (__VLS_ctx.mainStore.range !== null) {
                    __VLS_ctx.mainStore.range = null;
                    __VLS_ctx.mainStore.showInRange(null);
                }
                ;
            } },
        title: (__VLS_ctx.mainStore.t.i.buttons.clear),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
if (__VLS_ctx.mainStore.measure.show) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "control-measure" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    (__VLS_ctx.mainStore.t.i.captions.measure);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "imp_02" },
    });
    (__VLS_ctx.mainStore.measure.distance.toFixed(3));
    (__VLS_ctx.mainStore.t.i.text.km);
    for (const [id, index] of __VLS_getVForSourceType((__VLS_ctx.mainStore.measure.places))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
            ...{ onDragstart: (e => __VLS_ctx.handleDragStart(e, 'measure')) },
            ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
            ...{ onDrop: (__VLS_ctx.handleDrop) },
            key: (index),
            measureitem: (id),
            draggable: (true),
            ...{ class: "draggable" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (id !== null
            ? (__VLS_ctx.mainStore.places[id]
                ? __VLS_ctx.mainStore.places[id]
                : __VLS_ctx.mainStore.commonPlaces[id]).name
            : `${__VLS_ctx.mainStore.t.i.captions.measureChoose}:`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "control-buttons" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mainStore.measure.show))
                        return;
                    __VLS_ctx.mainStore.measure.choosing =
                        __VLS_ctx.mainStore.measure.choosing === index
                            ? __VLS_ctx.mainStore.measure.places.length
                            : index;
                } },
            title: (__VLS_ctx.mainStore.t.i.buttons.specify),
            ...{ class: (__VLS_ctx.mainStore.measure.choosing === index ? 'button-pressed' : '') },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mainStore.measure.show))
                        return;
                    __VLS_ctx.mainStore.measure.places.splice(index, 1);
                    __VLS_ctx.mainStore.measure.choosing = __VLS_ctx.mainStore.measure.places.length;
                    ;
                } },
            title: (__VLS_ctx.mainStore.t.i.buttons.clear),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    if (__VLS_ctx.mainStore.measure.places.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
            ...{ class: "control-measure-clearall" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.mainStore.t.i.buttons.clearAll);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mainStore.measure.show))
                        return;
                    if (!(__VLS_ctx.mainStore.measure.places.length > 0))
                        return;
                    __VLS_ctx.mainStore.measure.places.length = 0;
                    __VLS_ctx.mainStore.measure.choosing = 0;
                    ;
                } },
            title: (__VLS_ctx.mainStore.t.i.buttons.clearAll),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onKeyup: (__VLS_ctx.searchInputEvent) },
    ref: "searchInput",
    placeholder: (__VLS_ctx.mainStore.t.i.inputs.searchPlaces),
    title: (__VLS_ctx.mainStore.t.i.inputs.searchPlaces),
});
/** @type {typeof __VLS_ctx.searchInput} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "control-buttons" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.selectPlaces(__VLS_ctx.searchInput.value);
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons.find),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            if (__VLS_ctx.searchInput.value !== '') {
                __VLS_ctx.searchInput.value = '';
                __VLS_ctx.selectPlaces(__VLS_ctx.searchInput.value);
            }
            ;
        } },
    title: (__VLS_ctx.mainStore.t.i.buttons.clear),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "basic-left__places",
});
if (Object.keys(__VLS_ctx.mainStore.places).length > 0 || Object.keys(__VLS_ctx.mainStore.folders).length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: "places-menu",
        ...{ class: "menu" },
    });
    /** @type {[typeof PlacesTree, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(PlacesTree, new PlacesTree({
        instanceid: "placestree",
    }));
    const __VLS_12 = __VLS_11({
        instanceid: "placestree",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
}
if (Object.keys(__VLS_ctx.mainStore.commonPlaces).length > 0 && __VLS_ctx.commonPlacesShow) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "basiccolor" },
    });
    (__VLS_ctx.mainStore.t.i.captions.commonPlaces);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "margin_bottom" },
    });
    for (const [commonPlace] of __VLS_getVForSourceType((__VLS_ctx.commonPlaces))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(Object.keys(__VLS_ctx.mainStore.commonPlaces).length > 0 && __VLS_ctx.commonPlacesShow))
                        return;
                    __VLS_ctx.choosePlace({ place: commonPlace });
                } },
            ...{ onContextmenu: (e => {
                    e.preventDefault();
                    __VLS_ctx.choosePlace({
                        place: commonPlace,
                        mode: (__VLS_ctx.mainStore.mode === 'measure' ? 'measure' : 'normal'),
                    });
                }) },
            id: (commonPlace.id),
            key: (commonPlace.id),
            ...{ class: ('place-button block_01' + (commonPlace === __VLS_ctx.currentPlace ||
                    __VLS_ctx.mainStore.measure.places.includes(commonPlace.id)
                    ? ' active' : '')) },
        });
        (commonPlace.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "margin_bottom" },
    });
    for (const [page, index] of __VLS_getVForSourceType((__VLS_ctx.commonPlacesPagesCount))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ onClick: (...[$event]) => {
                    if (!(Object.keys(__VLS_ctx.mainStore.commonPlaces).length > 0 && __VLS_ctx.commonPlacesShow))
                        return;
                    __VLS_ctx.commonPlacesPage = index + 1;
                    ;
                } },
            key: (index),
            href: "javascript:void(0);",
            ...{ class: ('pseudo_button' + (index + 1 === __VLS_ctx.commonPlacesPage ? ' un_imp' : '')) },
        });
        (index + 1);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "basic-basic",
    ...{ class: "app-cell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.basicOnFull) },
    ...{ class: "basic-on-full button" },
    title: (__VLS_ctx.mainStore.t.i.hints.fullscreen),
});
const __VLS_14 = ((__VLS_ctx.maps[__VLS_ctx.mainStore.activeMapIndex].component));
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "basic-right",
    ...{ class: "app-cell" },
    ...{ style: (__VLS_ctx.sidebarSize.right === 0 ? 'display: none' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
if (__VLS_ctx.currentPlace) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [field] of __VLS_getVForSourceType((__VLS_ctx.orderedCurrentPlaceFields))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dl, __VLS_intrinsicElements.dl)({
            key: (field),
            ...{ class: "place-detailed margin_bottom_0" },
        });
        if (field === 'link') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
                ...{ class: "place-detailed__link-dt" },
            });
            if (!__VLS_ctx.linkEditing && __VLS_ctx.currentPlace[field].trim()) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                    href: (__VLS_ctx.currentPlace[field].trim()),
                    target: "_blank",
                });
                (__VLS_ctx.mainStore.placeFields[field]);
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.mainStore.placeFields[field]);
            }
        }
        else if (field === 'images' && __VLS_ctx.orderedImages.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
            (__VLS_ctx.mainStore.placeFields[field]);
        }
        if (field === 'waypoint') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "two-fields" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
            (__VLS_ctx.mainStore.placeFields['latitude']);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (e => __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { latitude: e.target.value.trim() } })) },
                id: "detailed-latitude",
                value: (__VLS_ctx.currentPlaceLat),
                type: "number",
                disabled: (!!__VLS_ctx.currentPlaceCommon),
                ...{ class: "fieldwidth_100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
            (__VLS_ctx.mainStore.placeFields['longitude']);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (e => __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { longitude: e.target.value.trim() } })) },
                id: "detailed-longitude",
                value: (__VLS_ctx.currentPlaceLon),
                type: "number",
                disabled: (!!__VLS_ctx.currentPlaceCommon),
                ...{ class: "fieldwidth_100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "two-fields__combined" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
            (__VLS_ctx.mainStore.placeFields['coordsMinSec']);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (e => { const coords = __VLS_ctx.string2coords(e.target.value.trim()); if (coords === null)
                        return; __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { latitude: coords[0], longitude: coords[1] } }); }) },
                id: "detailed-coordinates",
                value: (__VLS_ctx.currentDegMinSec),
                type: "text",
                disabled: (!!__VLS_ctx.currentPlaceCommon),
                ...{ class: "fieldwidth_100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "margin_bottom_1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.mainStore.placeFields['altitudecapability']);
            (__VLS_ctx.currentPlaceAltitude === null ? '?' : __VLS_ctx.currentPlaceAltitude);
        }
        else if (field !== 'common' && field !== 'link' && field !== 'waypoint' && field !== 'images') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
            (__VLS_ctx.mainStore.placeFields[field]);
        }
        if (field === 'srt' || field === 'link') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.currentPlace))
                            return;
                        if (!(field === 'srt' || field === 'link'))
                            return;
                        __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { [field]: __VLS_ctx.currentPlace[field] } });
                        ;
                    } },
                id: ('detailed-' + field),
                type: (field === 'srt' ? 'number' : 'text'),
                disabled: (!!__VLS_ctx.currentPlaceCommon),
                ...{ class: "fieldwidth_100" },
            });
            (__VLS_ctx.currentPlace[field]);
        }
        else if (field === 'time') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.currentPlace))
                            return;
                        if (!!(field === 'srt' || field === 'link'))
                            return;
                        if (!(field === 'time'))
                            return;
                        __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { [field]: __VLS_ctx.currentPlace[field] } });
                        ;
                    } },
                id: ('detailed-' + field),
                type: "datetime-local",
                disabled: (!!__VLS_ctx.currentPlaceCommon),
                ...{ class: "fieldwidth_100" },
            });
            (__VLS_ctx.currentPlace[field]);
        }
        else if (field === 'common') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
                ...{ class: "margin_bottom" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.currentPlace))
                            return;
                        if (!!(field === 'srt' || field === 'link'))
                            return;
                        if (!!(field === 'time'))
                            return;
                        if (!(field === 'common'))
                            return;
                        __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { [field]: __VLS_ctx.currentPlace[field] } });
                        ;
                    } },
                id: ('detailed-' + field),
                type: "checkbox",
                disabled: (!!__VLS_ctx.currentPlaceCommon),
            });
            (__VLS_ctx.currentPlace[field]);
            (__VLS_ctx.mainStore.t.i.inputs.checkboxCommon);
        }
        else if (field === 'images' && __VLS_ctx.orderedImages.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
                id: "place-images",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dd-images" },
            });
            for (const [image] of __VLS_getVForSourceType((__VLS_ctx.orderedImages))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.currentPlace))
                                return;
                            if (!!(field === 'srt' || field === 'link'))
                                return;
                            if (!!(field === 'time'))
                                return;
                            if (!!(field === 'common'))
                                return;
                            if (!(field === 'images' && __VLS_ctx.orderedImages.length))
                                return;
                            __VLS_ctx.router.push({ name: 'PlacesHomeImages', params: { imageId: image.id } }).catch(e => { console.error(e); });
                        } },
                    ...{ onDragstart: (e => __VLS_ctx.handleDragStart(e, 'images')) },
                    ...{ onDragenter: (__VLS_ctx.handleDragEnter) },
                    ...{ onDrop: (__VLS_ctx.handleDrop) },
                    id: (image.id),
                    key: (image.id),
                    'data-image': true,
                    ...{ class: ('place-image' + (__VLS_ctx.currentPlaceCommon ? '' : ' draggable')) },
                    draggable: (__VLS_ctx.currentPlaceCommon ? false : true),
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "block_02" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    ...{ class: "image-thumbnail border_1" },
                    draggable: (false),
                    src: (__VLS_ctx.constants.dirs.uploads.images.small + image.file),
                    alt: (__VLS_ctx.currentPlace.name),
                    title: (__VLS_ctx.currentPlace.name),
                });
                if (!__VLS_ctx.currentPlaceCommon) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ onClick: (e => {
                                e.stopPropagation();
                                __VLS_ctx.confirm(__VLS_ctx.deleteImages, [{ [image.id]: image }]);
                            }) },
                        ...{ class: "dd-images__delete button" },
                        draggable: (false),
                    });
                }
            }
        }
        else if (field !== 'waypoint' && field !== 'images') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.currentPlace))
                            return;
                        if (!!(field === 'srt' || field === 'link'))
                            return;
                        if (!!(field === 'time'))
                            return;
                        if (!!(field === 'common'))
                            return;
                        if (!!(field === 'images' && __VLS_ctx.orderedImages.length))
                            return;
                        if (!(field !== 'waypoint' && field !== 'images'))
                            return;
                        __VLS_ctx.mainStore.changePlace({ place: __VLS_ctx.currentPlace, change: { [field]: __VLS_ctx.currentPlace[field] } });
                        ;
                    } },
                id: ('detailed-' + field),
                value: (__VLS_ctx.currentPlace[field]),
                disabled: (!!__VLS_ctx.currentPlaceCommon),
                placeholder: (field === 'name' ? __VLS_ctx.mainStore.t.i.inputs.placeName : (field === 'description' ? __VLS_ctx.mainStore.t.i.inputs.placeDescription : '')),
                ...{ class: "fieldwidth_100" },
            });
        }
    }
}
if (__VLS_ctx.currentPlace && !__VLS_ctx.currentPlace.deleted && !__VLS_ctx.currentPlaceCommon) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "images-add margin_bottom" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "images-add__div button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.mainStore.t.i.buttons.addPhotos);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (e => __VLS_ctx.uploadFiles(e)) },
        id: "images-add__input",
        ref: "inputUploadFiles",
        type: "file",
        name: "files",
        multiple: true,
        ...{ class: "images-add__input" },
    });
    /** @type {typeof __VLS_ctx.inputUploadFiles} */ ;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "images-uploading",
    ...{ class: "block_02 waiting hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.loading);
if (__VLS_ctx.currentPlace && !__VLS_ctx.currentPlaceCommon) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (e => __VLS_ctx.mainStore.setHomePlace(e.target.checked ? __VLS_ctx.currentPlace.id : null)) },
        id: "checkbox-homeplace",
        type: "checkbox",
        checked: (__VLS_ctx.currentPlace === __VLS_ctx.mainStore.homePlace),
    });
    (__VLS_ctx.mainStore.t.i.inputs.checkboxHome);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toDBCompletely) },
    disabled: (__VLS_ctx.mainStore.saved),
    title: ((!__VLS_ctx.mainStore.saved ? (__VLS_ctx.mainStore.t.i.hints.notSaved + '. ') : '') + __VLS_ctx.mainStore.t.i.hints.sabeToDb),
    ...{ class: "save-button" },
});
(__VLS_ctx.mainStore.t.i.buttons.save);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "bottom-left",
    ...{ class: "app-cell" },
    ...{ style: (__VLS_ctx.sidebarSize.bottom === 0 || __VLS_ctx.sidebarSize.left === 0 ? 'display: none' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-buttons" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.placemarksShowHide();
        } },
    id: "placemarksShowHideButton",
    ...{ class: ('actions-button' + (__VLS_ctx.mainStore.placemarksShow ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.hints.shPlacemarks),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.places);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.commonPlacesShowHide();
            ;
        } },
    id: "commonPlacesShowHideButton",
    ...{ class: ('actions-button' + (__VLS_ctx.commonPlacesShow ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.hints.shCommonPlaces),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.commonPlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.commonPlacemarksShowHide();
        } },
    id: "commonPlacemarksShowHideButton",
    ...{ class: ('actions-button' + (__VLS_ctx.mainStore.commonPlacemarksShow ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.hints.shCommonPlacemarks),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.commonPlacemarks);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mainStore.centerPlacemarkShowHide();
        } },
    id: "centerPlacemarkShowHideButton",
    ...{ class: ('actions-button' + (__VLS_ctx.mainStore.centerPlacemarkShow ? ' button-pressed' : '')) },
    title: (__VLS_ctx.mainStore.t.i.hints.shCenter),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.buttons.center);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "bottom-basic",
    ...{ class: "app-cell" },
    ...{ style: (__VLS_ctx.sidebarSize.bottom === 0 ? 'display: none' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "choose-map" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (e => __VLS_ctx.mainStore.activeMapIndex = e.target.selectedIndex) },
    id: "choose-map-input",
    title: (__VLS_ctx.mainStore.t.i.hints.mapProvider),
});
for (const [map, index] of __VLS_getVForSourceType((__VLS_ctx.maps))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (index),
        value: (map.componentName),
        selected: (map.componentName === __VLS_ctx.maps[__VLS_ctx.mainStore.activeMapIndex].componentName),
    });
    (map.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "center-coordinates" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "imp" },
});
(__VLS_ctx.mainStore.t.i.buttons.center);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "nobr" },
    ...{ style: {} },
});
(__VLS_ctx.mainStore.t.i.captions.latitude);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "latitude",
    title: "mainStore.t.i.captions.latitude",
});
(__VLS_ctx.mainStore.center.latitude);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "nobr" },
    ...{ style: {} },
});
(__VLS_ctx.mainStore.t.i.captions.longitude);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "longitude",
    title: "mainStore.t.i.captions.longitude",
});
(__VLS_ctx.mainStore.center.longitude);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "nobr" },
    ...{ style: {} },
});
(__VLS_ctx.mainStore.t.i.captions.altitude);
(__VLS_ctx.centerAltitude);
const __VLS_18 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
if (__VLS_ctx.confirmPopup) {
    /** @type {[typeof PlacesPopupConfirm, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(PlacesPopupConfirm, new PlacesPopupConfirm({
        callback: (__VLS_ctx.confirmCallback),
        arguments: (__VLS_ctx.confirmCallbackArgs),
    }));
    const __VLS_23 = __VLS_22({
        callback: (__VLS_ctx.confirmCallback),
        arguments: (__VLS_ctx.confirmCallbackArgs),
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onMousedown: (e => __VLS_ctx.sidebarDragStart(e, 'top')) },
    ...{ onTouchstart: (e => __VLS_ctx.sidebarDragStart(e, 'top')) },
    id: "sbs-top",
    ...{ style: (`top: ${__VLS_ctx.sidebarSize.top - 11}px`) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onMousedown: (e => __VLS_ctx.sidebarDragStart(e, 'right')) },
    ...{ onTouchstart: (e => __VLS_ctx.sidebarDragStart(e, 'right')) },
    id: "sbs-right",
    ...{ style: (`right: ${__VLS_ctx.sidebarSize.right - 11}px`) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onMousedown: (e => __VLS_ctx.sidebarDragStart(e, 'bottom')) },
    ...{ onTouchstart: (e => __VLS_ctx.sidebarDragStart(e, 'bottom')) },
    id: "sbs-bottom",
    ...{ style: (`bottom: ${__VLS_ctx.sidebarSize.bottom - 11}px`) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onMousedown: (e => __VLS_ctx.sidebarDragStart(e, 'left')) },
    ...{ onTouchstart: (e => __VLS_ctx.sidebarDragStart(e, 'left')) },
    id: "sbs-left",
    ...{ style: (`left: ${__VLS_ctx.sidebarSize.left - 11}px`) },
});
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['basiccolor']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-link']} */ ;
/** @type {__VLS_StyleScopedClasses['invisible']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['border_1']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-button']} */ ;
/** @type {__VLS_StyleScopedClasses['control-range']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['control-measure']} */ ;
/** @type {__VLS_StyleScopedClasses['imp_02']} */ ;
/** @type {__VLS_StyleScopedClasses['draggable']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['control-measure-clearall']} */ ;
/** @type {__VLS_StyleScopedClasses['control-search']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['menu']} */ ;
/** @type {__VLS_StyleScopedClasses['basiccolor']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['basic-on-full']} */ ;
/** @type {__VLS_StyleScopedClasses['button']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['place-detailed']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['place-detailed__link-dt']} */ ;
/** @type {__VLS_StyleScopedClasses['two-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['two-fields__combined']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_1']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['dd-images']} */ ;
/** @type {__VLS_StyleScopedClasses['block_02']} */ ;
/** @type {__VLS_StyleScopedClasses['image-thumbnail']} */ ;
/** @type {__VLS_StyleScopedClasses['border_1']} */ ;
/** @type {__VLS_StyleScopedClasses['dd-images__delete']} */ ;
/** @type {__VLS_StyleScopedClasses['button']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldwidth_100']} */ ;
/** @type {__VLS_StyleScopedClasses['images-add']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['images-add__div']} */ ;
/** @type {__VLS_StyleScopedClasses['button']} */ ;
/** @type {__VLS_StyleScopedClasses['images-add__input']} */ ;
/** @type {__VLS_StyleScopedClasses['block_02']} */ ;
/** @type {__VLS_StyleScopedClasses['waiting']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['save-button']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['app-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['choose-map']} */ ;
/** @type {__VLS_StyleScopedClasses['center-coordinates']} */ ;
/** @type {__VLS_StyleScopedClasses['imp']} */ ;
/** @type {__VLS_StyleScopedClasses['nobr']} */ ;
/** @type {__VLS_StyleScopedClasses['nobr']} */ ;
/** @type {__VLS_StyleScopedClasses['nobr']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            constants: constants,
            string2coords: string2coords,
            PlacesDashboard: PlacesDashboard,
            PlacesTree: PlacesTree,
            PlacesPopupConfirm: PlacesPopupConfirm,
            mainStore: mainStore,
            router: router,
            currentPlaceCommon: currentPlaceCommon,
            foldersEditMode: foldersEditMode,
            toDBCompletely: toDBCompletely,
            deleteImages: deleteImages,
            handleDragStart: handleDragStart,
            handleDragEnter: handleDragEnter,
            handleDrop: handleDrop,
            maps: maps,
            root: root,
            basicOnFull: basicOnFull,
            inputImportFromFile: inputImportFromFile,
            inputUploadFiles: inputUploadFiles,
            commonPlacesPage: commonPlacesPage,
            commonPlacesPagesCount: commonPlacesPagesCount,
            commonPlacesShow: commonPlacesShow,
            sidebarSize: sidebarSize,
            sbs: sbs,
            gridStyle: gridStyle,
            linkEditing: linkEditing,
            orderedCurrentPlaceFields: orderedCurrentPlaceFields,
            currentPlace: currentPlace,
            commonPlaces: commonPlaces,
            orderedImages: orderedImages,
            currentPlaceLat: currentPlaceLat,
            currentPlaceLon: currentPlaceLon,
            currentDegMinSec: currentDegMinSec,
            currentPlaceAltitude: currentPlaceAltitude,
            centerAltitude: centerAltitude,
            confirmPopup: confirmPopup,
            confirmCallback: confirmCallback,
            confirmCallbackArgs: confirmCallbackArgs,
            confirm: confirm,
            installButtonEnabled: installButtonEnabled,
            installPWA: installPWA,
            exit: exit,
            choosePlace: choosePlace,
            appendPlace: appendPlace,
            commonPlacesShowHide: commonPlacesShowHide,
            importFromFile: importFromFile,
            uploadFiles: uploadFiles,
            sidebarDragStart: sidebarDragStart,
            documentMouseOver: documentMouseOver,
            sidebarDragStop: sidebarDragStop,
            rangeInput: rangeInput,
            searchInput: searchInput,
            searchInputEvent: searchInputEvent,
            selectPlaces: selectPlaces,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesHome.vue.js.map
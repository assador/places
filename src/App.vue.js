import { ref, computed, provide, onMounted, onBeforeMount } from 'vue';
import axios from 'axios';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { emitter } from '@/shared/bus';
import { isParentInTree } from '@/shared/common';
const draggingElement = ref(null);
const draggingType = ref(null);
const foldersEditMode = ref(false);
provide('foldersEditMode', foldersEditMode);
const idleTimeInterval = ref(null);
provide('idleTimeInterval', idleTimeInterval);
const currentPlaceCommon = ref(false);
provide('currentPlaceCommon', currentPlaceCommon);
const selectedToExport = ref({});
provide('selectedToExport', selectedToExport);
const installEvent = ref(null);
provide('installEvent', installEvent);
onBeforeMount(() => {
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        installEvent.value = e;
    });
});
const mainStore = useMainStore();
const router = useRouter();
const currentPlace = computed(() => mainStore.currentPlace);
const colortheme = computed(() => mainStore.colortheme);
const colorthemes = computed(() => [
    {
        value: 'brown',
        title: mainStore.t.i.inputs.colorthemeBrown,
    }, {
        value: 'blue',
        title: mainStore.t.i.inputs.colorthemeBlue,
    }, {
        value: 'pink',
        title: mainStore.t.i.inputs.colorthemePink,
    }, {
        value: 'green',
        title: mainStore.t.i.inputs.colorthemeGreen,
    }, {
        value: 'pink-light',
        title: mainStore.t.i.inputs.colorthemePinkLight,
    }, {
        value: 'blue-light',
        title: mainStore.t.i.inputs.colorthemeBlueLight,
    }, {
        value: 'purple-light',
        title: mainStore.t.i.inputs.colorthemePurpleLight,
    }, {
        value: 'green-light',
        title: mainStore.t.i.inputs.colorthemeGreenLight,
    },
]);
provide('colorthemes', colorthemes);
emitter.on('logged', async () => {
    await mainStore.setUser();
    await mainStore.setServerConfig();
    await mainStore.setPlaces();
    await mainStore.setUsers('common');
    mainStore.ready = true;
    router.push({ name: 'PlacesHome' });
});
emitter.on('toDB', (payload) => {
    switch (payload.what) {
        case 'waypoints':
            toDB({
                what: payload.what,
                data: payload.data
                    ? payload.data
                    : Object.values(mainStore.waypoints),
            });
            break;
        case 'places':
            toDB({
                what: payload.what,
                data: payload.data
                    ? payload.data
                    : Object.values(mainStore.places),
            });
            break;
        case 'folders':
            toDB({
                what: payload.what,
                data: payload.data
                    ? payload.data
                    : Object.values(mainStore.treeFlat),
            });
            break;
        case undefined:
            toDB({
                what: 'waypoints',
                data: Object.values(mainStore.waypoints),
            });
            toDB({
                what: 'places',
                data: Object.values(mainStore.places),
            });
            toDB({
                what: 'folders',
                data: Object.values(mainStore.treeFlat),
            });
            break;
        default:
            toDB(payload);
    }
});
emitter.on('homeToDB', (id) => {
    homeToDB(id);
});
emitter.on('toDBCompletely', () => {
    toDBCompletely();
});
emitter.on('getFolderById', (id) => {
    return mainStore.treeFlat[id];
});
mainStore.changeLang(mainStore.lang);
onMounted(() => {
    /*
    If the App is mounted during the session (for example, when the page
    is reloaded), the store state is restored from sessionStorage.
    */
    if (sessionStorage.getItem('places-store-state')) {
        mainStore.replaceState(JSON.parse(sessionStorage.getItem('places-store-state')));
    }
    document.addEventListener('mousedown', () => { mainStore.idleTime = 0; }, false);
    document.addEventListener('keyup', () => { mainStore.idleTime = 0; }, false);
    /*
        mainStore.$subscribe((mutation, state) => {
            console.log(mutation);
            console.log(state);
        });
    */
    mainStore.$onAction((action) => {
        if (!mainStore.user || mainStore.user.testaccount)
            return;
        switch (action.name) {
            case 'addPlace':
            case 'addFolder':
            case 'deletePlace':
            case 'deleteFolder':
            case 'changePlace':
            case 'changeFolder':
            case 'changeWaypoint':
            case 'moveFolder':
            case 'setHomePlace':
            case 'swapImages':
            case 'undo':
            case 'redo':
                mainStore.saved = false;
                break;
        }
    });
});
const toDB = async (payload) => {
    if (mainStore.user.testaccount)
        return;
    if (document.querySelector('.value_wrong')) {
        mainStore.setMessage(mainStore.t.m.paged.incorrectFields);
        return;
    }
    payload.id = sessionStorage.getItem('places-userid');
    return axios.post('/backend/set_' +
        (payload.what === 'waypoints' ? 'waypoints' : 'places') +
        '.php', payload)
        .then(response => {
        if (payload.what === 'waypoints' &&
            response.data.length > 0) {
            /*
            When adding new waypoints, the backend found existing
            waypoints with the same coordinates and returned them:
            no need to create new ones; or:
            When updating waypoints, backend found them common,
            created new waypoints with new values and returned them.
            Then we update the waypoint key of the corresponding places.
            */
            for (const rec of response.data) {
                if (!mainStore.waypoints[rec.waypoint.id]) {
                    mainStore.addWaypoint({
                        'waypoint': rec.waypoint,
                        'todb': false,
                    });
                }
                mainStore['change' +
                    rec.waypointof.type.charAt(0).toUpperCase() +
                    rec.waypointof.type.slice(1)]({
                    [rec.waypointof.type]: mainStore[rec.waypointof.type + 's'][rec.waypointof.id],
                    change: {
                        waypoint: rec.waypoint.id,
                    }
                });
            }
        }
        else {
            for (const fault of response.data) {
                switch (fault) {
                    case 1:
                        mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
                        return;
                    case 2:
                        return;
                    case 3:
                        mainStore.setMessage(mainStore.t.m.popup.placesCountExceeded);
                        return;
                    case 4:
                        mainStore.setMessage(mainStore.t.m.paged.foldersCountExceeded);
                        return;
                }
            }
        }
        mainStore.savedToDB(payload);
        mainStore.setMessage(mainStore.t.m.popup.savedToDb);
    })
        .catch(error => {
        mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb + ': ' + error);
    });
};
provide('toDB', toDB);
const toDBCompletely = async () => {
    if (mainStore.user.testaccount)
        return;
    const waypoints = [], places = [], folders = [];
    for (const waypoint of Object.values(mainStore.waypoints)) {
        if (waypoint.added ||
            waypoint.deleted ||
            waypoint.updated) {
            waypoints.push(waypoint);
        }
    }
    for (const place of Object.values(mainStore.places)) {
        if (place.added ||
            place.deleted ||
            place.updated) {
            places.push(place);
        }
    }
    for (const folder of Object.values(mainStore.treeFlat)) {
        if (folder.added ||
            folder.deleted ||
            folder.updated) {
            folders.push(folder);
        }
    }
    await toDB({ what: 'waypoints', data: waypoints });
    await toDB({ what: 'places', data: places });
    await toDB({ what: 'folders', data: folders });
};
provide('toDBCompletely', toDBCompletely);
const homeToDB = async (id) => {
    if (mainStore.user.testaccount)
        return;
    return axios.post('/backend/set_home.php', { id: sessionStorage.getItem('places-userid'), data: id })
        .then(() => {
        mainStore.saved = true;
        mainStore.setMessage(mainStore.t.m.popup.savedToDb);
    })
        .catch(error => {
        mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb + ': ' + error);
    });
};
const deleteImages = (images, family) => {
    const data = new FormData();
    for (const [id, image] of Object.entries(images)) {
        data.append('file_' + id, image.file);
    }
    data.append('userid', mainStore.user.id);
    if (!mainStore.user.testaccount) {
        axios.post('/backend/delete.php', data)
            .then(() => {
            toDB({
                what: 'images_delete',
                data: Object.values(images),
            });
        });
    }
    mainStore.deleteImages({ images: images, family: family });
};
provide('deleteImages', deleteImages);
const exportPlaces = (places, mime) => {
    const a = document.createElement('a');
    let content = '';
    switch (mime) {
        case 'application/gpx+xml':
            a.download = 'places.gpx';
            a.dataset.downloadurl = ['application/gpx+xml', a.download, a.href].join(':');
            content =
                '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
                    + '<gpx'
                    + ' version="1.1"'
                    + ' xmlns="http://www.topografix.com/GPX/1/1"'
                    + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
                    + ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
            for (const p of Object.values(places)) {
                content +=
                    '<wpt lat="' +
                        mainStore.waypoints[p.waypoint].latitude +
                        '" lon="' +
                        mainStore.waypoints[p.waypoint].longitude +
                        '">';
                content += p.name ? ('<name>' + p.name + '</name>') : '';
                content += p.description ? ('<desc>' + p.description + '</desc>') : '';
                content += p.link ? ('<link href="' + p.link + '"></link>') : '';
                content += p.time ? ('<time>' + p.time + '</time>') : '';
                content += '</wpt>';
            }
            content += '</gpx>';
            break;
        default:
            mime = 'application/json';
            a.download = 'places.json';
            a.dataset.downloadurl = ['application/json', a.download, a.href].join(':');
            const waypoints = [], folders = [];
            let parentFolder;
            for (const p of Object.values(places)) {
                waypoints.push(Object.assign({}, mainStore.waypoints[p.waypoint]));
                if (!folders.find(f => f.id === p.folderid)) {
                    parentFolder = mainStore.treeFlat[p.folderid];
                    while (parentFolder.id !== 'root' &&
                        !folders.find(f => f.id === parentFolder.id)) {
                        folders.push(Object.assign({}, parentFolder));
                        parentFolder = mainStore.treeFlat[parentFolder.parent];
                    }
                }
            }
            const placesArray = [];
            for (const place of Object.values(places)) {
                placesArray.push(Object.assign({}, place));
                delete placesArray[placesArray.length - 1].type;
                delete placesArray[placesArray.length - 1].show;
                delete placesArray[placesArray.length - 1].added;
                delete placesArray[placesArray.length - 1].deleted;
                delete placesArray[placesArray.length - 1].updated;
                delete placesArray[placesArray.length - 1].geomark;
                delete placesArray[placesArray.length - 1].images;
            }
            for (const waypoint of Object.values(waypoints)) {
                delete waypoint.type;
                delete waypoint.show;
                delete waypoint.added;
                delete waypoint.deleted;
                delete waypoint.updated;
            }
            for (const folder of Object.values(folders)) {
                delete folder.type;
                delete folder.added;
                delete folder.deleted;
                delete folder.updated;
                delete folder.opened;
                delete folder.builded;
                delete folder.geomarks;
                delete folder.children;
            }
            content = JSON.stringify({
                places: placesArray,
                waypoints: waypoints,
                folders: folders,
            });
    }
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.click();
};
provide('exportPlaces', exportPlaces);
const handleDragStart = (event, type) => {
    mainStore.idleTime = 0;
    event.dataTransfer.setData('text/plain', null);
    draggingElement.value = event.target;
    if (type)
        draggingType.value = type;
};
provide('handleDragStart', handleDragStart);
const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggingElement.value ||
        event.target.nodeType !== 1 ||
        draggingElement.value === event.target)
        return;
    switch (draggingType.value) {
        case 'measure':
            const measureId1 = draggingElement.value.getAttribute('measureitem');
            const measureId2 = event.target.getAttribute('measureitem');
            if (!measureId1 || !measureId2)
                return;
            const measureIds = mainStore.measure.places;
            const measureIdx1 = measureIds.indexOf(measureId1);
            const measureIdx2 = measureIds.indexOf(measureId2);
            [measureIds[measureIdx1], measureIds[measureIdx2]] =
                [measureIds[measureIdx2], measureIds[measureIdx1]];
            mainStore.measure.places = measureIds;
            mainStore.measureDistance();
            draggingElement.value = event.target;
            return;
        case 'images':
            const ids = [];
            for (const id in currentPlace.value.images) {
                if (id === draggingElement.value.id) {
                    ids.push(id);
                }
                if (id === event.target.id) {
                    ids.push(id);
                }
                if (ids.length === 2)
                    break;
            }
            mainStore.swapImages({
                place: currentPlace.value,
                ids: ids,
            });
            return;
        default:
            const draggingElementPP = draggingElement.value.parentElement.parentElement;
            if (event.target.dataset.folderButton !== undefined &&
                (draggingElement.value.dataset.folderButton !== undefined ||
                    draggingElement.value.dataset.placeButton !== undefined)) {
                event.target.classList.add('highlighted');
            }
            if (draggingElement.value.dataset.placeButton !== undefined &&
                event.target.dataset.placeButtonDragenterAreaTop !== undefined &&
                event.target.parentElement !== draggingElement.value &&
                event.target.parentElement !== draggingElement.value.nextElementSibling) {
                event.target.classList.add('dragenter-area_top_border');
            }
            else if (draggingElement.value.dataset.placeButton !== undefined &&
                event.target.dataset.placeButtonDragenterAreaBottom !== undefined &&
                event.target.parentElement !== draggingElement.value &&
                event.target.parentElement !== draggingElement.value.previousElementSibling) {
                event.target.classList.add('dragenter-area_bottom_border');
            }
            else if (draggingElement.value.dataset.folderButton !== undefined &&
                event.target.dataset.folderDragenterAreaTop !== undefined &&
                event.target.parentElement !== draggingElementPP &&
                event.target.parentElement !== draggingElementPP.nextElementSibling) {
                event.target.classList.add('dragenter-area_top_border');
            }
            else if (draggingElement.value.dataset.folderButton !== undefined &&
                event.target.dataset.folderDragenterAreaBottom !== undefined &&
                event.target.parentElement !== draggingElementPP &&
                event.target.parentElement !== draggingElementPP.previousElementSibling) {
                event.target.classList.add('dragenter-area_bottom_border');
            }
            break;
    }
};
provide('handleDragEnter', handleDragEnter);
const handleDragLeave = (event) => {
    if (event.target.nodeType === 1) {
        event.preventDefault();
        event.target.classList.remove('highlighted');
        event.target.classList.remove('dragenter-area_top_border');
        event.target.classList.remove('dragenter-area_bottom_border');
        event.target.classList.remove('dragenter-area_top_border');
        event.target.classList.remove('dragenter-area_bottom_border');
    }
};
provide('handleDragLeave', handleDragLeave);
const handleDragOver = (event) => {
    event.preventDefault();
};
provide('handleDragOver', handleDragOver);
const handleDrop = (event) => {
    draggingType.value = null;
    if (draggingElement.value === null)
        return;
    event.preventDefault();
    event.stopPropagation();
    if (event.target.nodeType !== 1 ||
        draggingElement.value === event.target &&
            draggingElement.value.dataset.image === undefined)
        return;
    const targetSrt = Number(event.target.parentElement.getAttribute('srt') ||
        event.target.parentElement.parentElement.getAttribute('srt')) || 0, changes = { folder: {}, place: {} };
    let newContainer;
    const change = () => {
        if (Object.keys(changes.place).length) {
            mainStore.changePlace({
                place: mainStore.places[draggingElement.value.id.match(/[\d\w]+$/)[0]],
                change: changes.place,
            });
        }
        if (Object.keys(changes.folder).length) {
            mainStore.moveFolder({
                folderId: changes.folder.id,
                targetId: changes.folder.parent,
                srt: Number(changes.folder.srt) || 0,
                backup: false,
            });
        }
    };
    const cleanup = () => {
        event.target.dispatchEvent(new Event('dragleave'));
        draggingElement.value = null;
    };
    // Place button was dropped on the folder link
    if (draggingElement.value.dataset.placeButton !== undefined &&
        event.target.dataset.folderButton !== undefined &&
        event.target.id.replace(/^.*-([^-]*)/, "$1") !==
            mainStore.places[draggingElement.value.id].folderid) {
        newContainer =
            event.target.parentElement.nextElementSibling.nextElementSibling;
        if (newContainer.lastElementChild) {
            changes.place.srt = mainStore.places[newContainer.lastElementChild.id].srt + 1;
        }
        else {
            changes.place.srt = 1;
        }
        changes.place.folderid =
            newContainer.id.replace(/^.*-([^-]*)/, "$1");
        change();
        cleanup();
        return;
    }
    /*
    Place button was dropped
    on the top sorting area of another place button
    */
    if (draggingElement.value.dataset.placeButton !== undefined &&
        event.target.dataset.placeButtonDragenterAreaTop !== undefined &&
        event.target.parentElement !== draggingElement.value.nextElementSibling) {
        if (!event.target.parentElement.previousElementSibling) {
            changes.place.srt = targetSrt / 2;
        }
        else {
            const targetPrevSrt = Number(event.target.parentElement.previousElementSibling
                .getAttribute('srt')) || 0;
            changes.place.srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
        }
        if (draggingElement.value.parentElement !== event.target.parentElement.parentElement) {
            changes.place.folderid = event.target.parentElement.parentElement.id.match(/[\d\w]+$/)[0];
        }
        event.target.classList.remove('dragenter-area_top_border');
        change();
        cleanup();
        return;
    }
    /*
    Place button was dropped
    on the bottom sorting area of another place button
    */
    if (draggingElement.value.dataset.placeButton !== undefined &&
        event.target.dataset.placeButtonDragenterAreaBottom !== undefined &&
        event.target.parentElement !== draggingElement.value.previousElementSibling) {
        if (!event.target.parentElement.nextElementSibling) {
            changes.place.srt = targetSrt + 1;
        }
        else {
            const targetNextSrt = Number(event.target.parentElement.nextElementSibling.getAttribute('srt')) || 0;
            changes.place.srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
        }
        if (draggingElement.value.parentElement !== event.target.parentElement.parentElement) {
            changes.place.folderid = event.target.parentElement.parentElement.id.match(/[\d\w]+$/)[0];
        }
        event.target.classList.remove('dragenter-area_bottom_border');
        change();
        cleanup();
        return;
    }
    // Folder link was dropped on the sorting area of another folder link
    if (draggingElement.value.dataset.folderButton !== undefined &&
        (event.target.dataset.folderDragenterAreaTop !== undefined ||
            event.target.dataset.folderDragenterAreaBottom !== undefined) &&
        !!(changes.folder.id =
            draggingElement.value.id.replace(/^.*-([^-]*)/, "$1")) &&
        !!(changes.folder.parent =
            event.target.parentElement.parentElement.parentElement.parentElement
                .id.replace(/^.*-([^-]*)/, "$1")) &&
        changes.folder.id !== changes.folder.parent &&
        !isParentInTree(mainStore.tree, 'children', changes.folder.id, changes.folder.parent)) {
        if (event.target.dataset.folderDragenterAreaTop !== undefined &&
            draggingElement.value.parentElement.parentElement !==
                event.target.parentElement.previousElementSibling) {
            if (!event.target.parentElement.previousElementSibling) {
                changes.folder.srt = targetSrt / 2;
            }
            else {
                const targetPrevSrt = Number(event.target.parentElement.previousElementSibling
                    .getAttribute('srt')) || 0;
                changes.folder.srt =
                    (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
            }
        }
        else if (event.target.dataset.folderDragenterAreaBottom !== undefined &&
            draggingElement.value.parentElement.parentElement !==
                event.target.parentElement.nextElementSibling) {
            if (!event.target.parentElement.nextElementSibling) {
                changes.folder.srt = targetSrt + 1;
            }
            else {
                const targetNextSrt = Number(event.target.parentElement.nextElementSibling
                    .getAttribute('srt')) || 0;
                changes.folder.srt =
                    (targetNextSrt - targetSrt) / 2 + targetSrt;
            }
        }
        change();
        cleanup();
        return;
    }
    // Folder link dropped on another folder link
    if (draggingElement.value.dataset.folderButton !== undefined &&
        event.target.dataset.folderButton !== undefined &&
        !!(changes.folder.id =
            draggingElement.value.id.replace(/^.*-([^-]*)/, "$1")) &&
        !!(changes.folder.parent =
            event.target.id.replace(/^.*-([^-]*)/, "$1")) &&
        changes.folder.id !== changes.folder.parent && (!mainStore.treeFlat[changes.folder.parent].children ||
        !mainStore.treeFlat[changes.folder.parent].children[changes.folder.id]) &&
        !isParentInTree(mainStore.tree, 'children', changes.folder.id, changes.folder.parent)) {
        newContainer =
            event.target.parentElement.nextElementSibling.firstElementChild;
        if (newContainer && newContainer.lastElementChild) {
            changes.folder.srt = mainStore.treeFlat[newContainer.lastElementChild.id.replace(/^.*-([^-]*)/, "$1")].srt + 1;
        }
        else {
            changes.folder.srt = 1;
        }
        change();
        cleanup();
        return;
    }
    // Image thumbnail dropped
    if (draggingElement.value.dataset.image !== undefined) {
        mainStore.changePlace({
            place: currentPlace.value,
            change: {},
        });
        toDB({ what: 'places', data: [currentPlace.value] });
        cleanup();
        return;
    }
    cleanup();
};
provide('handleDrop', handleDrop);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "container",
    ...{ class: ('colortheme-' + __VLS_ctx.colortheme) },
});
const __VLS_0 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            colortheme: colortheme,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map
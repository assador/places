import { ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { emitter } from '@/shared/bus';
import { LMap, LTileLayer, LMarker, LTooltip, LIcon, LControlLayers, LPolyline,
/*
    LPopup,
    LPolygon,
    LRectangle,
*/
 } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { coords2string } from '@/shared/common';
const mainStore = useMainStore();
const map = inject('extmap');
const icon_01 = ref({
    iconUrl: '/img/markers/marker_01.svg',
    iconSize: [25, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
    shadowUrl: '/img/markers/marker_01_shadow.svg',
    shadowSize: [25, 38],
    shadowAnchor: [2, 24],
});
const icon_01_blue = ref({
    iconUrl: '/img/markers/marker_01_blue.svg',
    iconSize: [25, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
    shadowUrl: '/img/markers/marker_01_shadow_blue.svg',
    shadowSize: [25, 38],
    shadowAnchor: [2, 24],
});
const icon_01_green = ref({
    iconUrl: '/img/markers/marker_01_green.svg',
    iconSize: [25, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
    shadowUrl: '/img/markers/marker_01_shadow_green.svg',
    shadowSize: [25, 38],
    shadowAnchor: [2, 24],
});
const icon_02 = ref({
    iconUrl: '/img/markers/marker_02.svg',
    iconSize: [25, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
    shadowUrl: '/img/markers/marker_01_shadow.svg',
    shadowSize: [25, 38],
    shadowAnchor: [2, 24],
});
const icon_center = ref({
    iconUrl: '/img/markers/marker_center.svg',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [25, -25],
});
const providers = ref([{
        name: mainStore.t.i.maps.osm,
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        visible: true,
    }, {
        name: mainStore.t.i.maps.satellite,
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        visible: false,
    }, {
        name: mainStore.t.i.maps.topography,
        url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
        visible: false,
    }, {
        name: mainStore.t.i.maps.tourists,
        url: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
        visible: false,
    }, {
        name: mainStore.t.i.maps.transport,
        url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
        visible: false,
    }, {
        name: mainStore.t.i.maps.aero,
        url: 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
        visible: false,
    }, {
        name: mainStore.t.i.maps.bicycles,
        url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        visible: false,
    }, {
        name: mainStore.t.i.maps.railroads,
        url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        visible: false,
    }]);
const mapCenter = computed(() => ({
    coords: [
        mainStore.center.latitude,
        mainStore.center.longitude,
    ],
    zoom: mainStore.zoom,
}));
const commonPlacesPage = inject('commonPlacesPage');
const commonPlacesOnPageCount = inject('commonPlacesOnPageCount');
const dragging = ref(false);
const getMeasurePolylineCoords = () => {
    const coords = [];
    let place;
    for (const idx in mainStore.measure.places) {
        if (mainStore.places[mainStore.measure.places[idx]]) {
            place = mainStore.places[mainStore.measure.places[idx]];
        }
        else {
            place = mainStore.commonPlaces[mainStore.measure.places[idx]];
        }
        coords.push([
            mainStore.waypoints[place.waypoint].latitude,
            mainStore.waypoints[place.waypoint].longitude,
        ]);
    }
    return coords;
};
const placemarkClick = (place, e) => {
    e.preventDefault();
    switch (mainStore.mode) {
        case 'measure':
            emitter.emit('choosePlace', {
                place: place,
                mode: (e.type === 'contextmenu' ? 'measure' : 'normal'),
            });
            break;
        default:
            if (e.type === 'contextmenu') {
                mainStore.setMessage(place.name, true);
                mainStore.setMessage(coords2string([
                    mainStore.waypoints[place.waypoint].latitude,
                    mainStore.waypoints[place.waypoint].longitude
                ]), true);
                mainStore.setMessage(place.description, true);
            }
            else {
                emitter.emit('choosePlace', { place: place });
            }
            break;
    }
    if (place.common) {
        const inPaginator = Object.keys(mainStore.commonPlaces).indexOf(place.id) /
            commonPlacesOnPageCount.value;
        commonPlacesPage.value = (Number.isInteger(inPaginator)
            ? inPaginator + 1
            : Math.ceil(inPaginator));
    }
};
const placemarkDragStart = (place) => {
    if (place !== mainStore.currentPlace) {
        mainStore.setMessage(mainStore.t.m.popup.needToChoosePlacemark);
    }
};
const placemarkDragEnd = (place, event) => {
    const coordinates = event.target.getLatLng();
    mainStore.changePlace({
        place: place,
        change: {
            latitude: Number(coordinates.lat.toFixed(7)),
            longitude: Number(coordinates.lng.toFixed(7)),
        },
    });
};
const updateState = (payload) => {
    mainStore.updateMap({
        latitude: Number(payload && payload.coords
            ? payload.coords[0].toFixed(7)
            : map.value.leafletObject.getCenter().lat.toFixed(7)),
        longitude: Number(payload && payload.coords
            ? payload.coords[1].toFixed(7)
            : map.value.leafletObject.getCenter().lng.toFixed(7)),
        zoom: Number(payload && payload.zoom
            ? payload.zoom
            : map.value.leafletObject.getZoom()),
    });
};
const ready = () => {
    map.value.leafletObject.panTo(mapCenter.value.coords);
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "mapblock",
});
const __VLS_0 = {}.LMap;
/** @type {[typeof __VLS_components.LMap, typeof __VLS_components.lMap, typeof __VLS_components.LMap, typeof __VLS_components.lMap, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onReady': {} },
    ...{ 'onMoveend': {} },
    ref: "map",
    zoom: (__VLS_ctx.mapCenter.zoom),
    center: (__VLS_ctx.mapCenter.coords),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onReady': {} },
    ...{ 'onMoveend': {} },
    ref: "map",
    zoom: (__VLS_ctx.mapCenter.zoom),
    center: (__VLS_ctx.mapCenter.coords),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onReady: (...[$event]) => {
        __VLS_ctx.ready();
    }
};
const __VLS_8 = {
    onMoveend: (...[$event]) => {
        __VLS_ctx.updateState();
    }
};
/** @type {typeof __VLS_ctx.map} */ ;
var __VLS_9 = {};
__VLS_3.slots.default;
const __VLS_11 = {}.LControlLayers;
/** @type {[typeof __VLS_components.LControlLayers, typeof __VLS_components.lControlLayers, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
for (const [provider, index] of __VLS_getVForSourceType((__VLS_ctx.providers))) {
    const __VLS_15 = {}.LTileLayer;
    /** @type {[typeof __VLS_components.LTileLayer, typeof __VLS_components.lTileLayer, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        key: ('key' + index),
        name: (provider.name),
        url: (provider.url),
        visible: (provider.visible),
        layerType: "base",
    }));
    const __VLS_17 = __VLS_16({
        key: ('key' + index),
        name: (provider.name),
        url: (provider.url),
        visible: (provider.visible),
        layerType: "base",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
}
const __VLS_19 = {}.LMarker;
/** @type {[typeof __VLS_components.LMarker, typeof __VLS_components.lMarker, typeof __VLS_components.LMarker, typeof __VLS_components.lMarker, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ 'onMoveend': {} },
    ref: "centerMarker",
    latLng: (__VLS_ctx.mapCenter.coords),
    draggable: true,
    visible: (__VLS_ctx.mainStore.centerPlacemarkShow ? true : false),
}));
const __VLS_21 = __VLS_20({
    ...{ 'onMoveend': {} },
    ref: "centerMarker",
    latLng: (__VLS_ctx.mapCenter.coords),
    draggable: true,
    visible: (__VLS_ctx.mainStore.centerPlacemarkShow ? true : false),
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_23;
let __VLS_24;
let __VLS_25;
const __VLS_26 = {
    onMoveend: (e => __VLS_ctx.updateState({
        coords: [
            e.target.getLatLng().lat,
            e.target.getLatLng().lng,
        ],
    }))
};
/** @type {typeof __VLS_ctx.centerMarker} */ ;
var __VLS_27 = {};
__VLS_22.slots.default;
const __VLS_29 = {}.LIcon;
/** @type {[typeof __VLS_components.LIcon, typeof __VLS_components.lIcon, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    ...(__VLS_ctx.icon_center),
}));
const __VLS_31 = __VLS_30({
    ...(__VLS_ctx.icon_center),
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const __VLS_33 = {}.LTooltip;
/** @type {[typeof __VLS_components.LTooltip, typeof __VLS_components.lTooltip, typeof __VLS_components.LTooltip, typeof __VLS_components.lTooltip, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({}));
const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
(__VLS_ctx.mainStore.t.i.maps.center);
var __VLS_36;
var __VLS_22;
for (const [place, id] of __VLS_getVForSourceType((__VLS_ctx.mainStore.places))) {
    const __VLS_37 = {}.LMarker;
    /** @type {[typeof __VLS_components.LMarker, typeof __VLS_components.lMarker, typeof __VLS_components.LMarker, typeof __VLS_components.lMarker, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        ...{ 'onClick': {} },
        ...{ 'onContextmenu': {} },
        ...{ 'onMousedown': {} },
        ...{ 'onMouseup': {} },
        ...{ 'onMousemove': {} },
        ...{ 'onMoveend': {} },
        key: (id),
        latLng: ([
            __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].latitude : 0,
            __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].longitude : 0,
        ]),
        draggable: (id === __VLS_ctx.mainStore.currentPlace.id),
        visible: (__VLS_ctx.mainStore.placemarksShow && place.show && place.geomark ? true : false),
    }));
    const __VLS_39 = __VLS_38({
        ...{ 'onClick': {} },
        ...{ 'onContextmenu': {} },
        ...{ 'onMousedown': {} },
        ...{ 'onMouseup': {} },
        ...{ 'onMousemove': {} },
        ...{ 'onMoveend': {} },
        key: (id),
        latLng: ([
            __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].latitude : 0,
            __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].longitude : 0,
        ]),
        draggable: (id === __VLS_ctx.mainStore.currentPlace.id),
        visible: (__VLS_ctx.mainStore.placemarksShow && place.show && place.geomark ? true : false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    let __VLS_41;
    let __VLS_42;
    let __VLS_43;
    const __VLS_44 = {
        onClick: (e => __VLS_ctx.placemarkClick(place, e.originalEvent))
    };
    const __VLS_45 = {
        onContextmenu: (e => __VLS_ctx.placemarkClick(place, e.originalEvent))
    };
    const __VLS_46 = {
        onMousedown: (() => __VLS_ctx.dragging = true)
    };
    const __VLS_47 = {
        onMouseup: (() => __VLS_ctx.dragging = false)
    };
    const __VLS_48 = {
        onMousemove: (e => { if (__VLS_ctx.dragging)
            __VLS_ctx.placemarkDragStart(place); })
    };
    const __VLS_49 = {
        onMoveend: (e => __VLS_ctx.placemarkDragEnd(place, e))
    };
    __VLS_40.slots.default;
    const __VLS_50 = {}.LIcon;
    /** @type {[typeof __VLS_components.LIcon, typeof __VLS_components.lIcon, ]} */ ;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        ...(__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(id) && place !== __VLS_ctx.mainStore.currentPlace
            ? __VLS_ctx.icon_01_blue
            : (place === __VLS_ctx.mainStore.currentPlace ? __VLS_ctx.icon_01_green : __VLS_ctx.icon_01)),
    }));
    const __VLS_52 = __VLS_51({
        ...(__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(id) && place !== __VLS_ctx.mainStore.currentPlace
            ? __VLS_ctx.icon_01_blue
            : (place === __VLS_ctx.mainStore.currentPlace ? __VLS_ctx.icon_01_green : __VLS_ctx.icon_01)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    const __VLS_54 = {}.LTooltip;
    /** @type {[typeof __VLS_components.LTooltip, typeof __VLS_components.lTooltip, typeof __VLS_components.LTooltip, typeof __VLS_components.lTooltip, ]} */ ;
    // @ts-ignore
    const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
        permanent: "true",
    }));
    const __VLS_56 = __VLS_55({
        permanent: "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_55));
    __VLS_57.slots.default;
    (place.name);
    var __VLS_57;
    var __VLS_40;
}
if (__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.length) {
    const __VLS_58 = {}.LPolyline;
    /** @type {[typeof __VLS_components.LPolyline, typeof __VLS_components.lPolyline, typeof __VLS_components.LPolyline, typeof __VLS_components.lPolyline, ]} */ ;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
        latLngs: (__VLS_ctx.getMeasurePolylineCoords()),
        color: "rgba(0, 0, 0, 1)",
        weight: (0.5),
    }));
    const __VLS_60 = __VLS_59({
        latLngs: (__VLS_ctx.getMeasurePolylineCoords()),
        color: "rgba(0, 0, 0, 1)",
        weight: (0.5),
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
}
for (const [place, id] of __VLS_getVForSourceType((__VLS_ctx.mainStore.commonPlaces))) {
    const __VLS_62 = {}.LMarker;
    /** @type {[typeof __VLS_components.LMarker, typeof __VLS_components.lMarker, typeof __VLS_components.LMarker, typeof __VLS_components.lMarker, ]} */ ;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent(__VLS_62, new __VLS_62({
        ...{ 'onClick': {} },
        ...{ 'onContextmenu': {} },
        key: (id),
        latLng: ([
            __VLS_ctx.mainStore.waypoints[place.waypoint].latitude,
            __VLS_ctx.mainStore.waypoints[place.waypoint].longitude,
        ]),
        visible: (__VLS_ctx.mainStore.commonPlacemarksShow && place.geomark ? true : false),
    }));
    const __VLS_64 = __VLS_63({
        ...{ 'onClick': {} },
        ...{ 'onContextmenu': {} },
        key: (id),
        latLng: ([
            __VLS_ctx.mainStore.waypoints[place.waypoint].latitude,
            __VLS_ctx.mainStore.waypoints[place.waypoint].longitude,
        ]),
        visible: (__VLS_ctx.mainStore.commonPlacemarksShow && place.geomark ? true : false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    let __VLS_66;
    let __VLS_67;
    let __VLS_68;
    const __VLS_69 = {
        onClick: (e => __VLS_ctx.placemarkClick(place, e.originalEvent))
    };
    const __VLS_70 = {
        onContextmenu: (e => __VLS_ctx.placemarkClick(place, e.originalEvent))
    };
    __VLS_65.slots.default;
    const __VLS_71 = {}.LIcon;
    /** @type {[typeof __VLS_components.LIcon, typeof __VLS_components.lIcon, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
        ...(__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(id) && place !== __VLS_ctx.mainStore.currentPlace
            ? __VLS_ctx.icon_01_blue
            : (place === __VLS_ctx.mainStore.currentPlace ? __VLS_ctx.icon_01_green : __VLS_ctx.icon_02)),
    }));
    const __VLS_73 = __VLS_72({
        ...(__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(id) && place !== __VLS_ctx.mainStore.currentPlace
            ? __VLS_ctx.icon_01_blue
            : (place === __VLS_ctx.mainStore.currentPlace ? __VLS_ctx.icon_01_green : __VLS_ctx.icon_02)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_72));
    const __VLS_75 = {}.LTooltip;
    /** @type {[typeof __VLS_components.LTooltip, typeof __VLS_components.lTooltip, typeof __VLS_components.LTooltip, typeof __VLS_components.lTooltip, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({}));
    const __VLS_77 = __VLS_76({}, ...__VLS_functionalComponentArgsRest(__VLS_76));
    __VLS_78.slots.default;
    (place.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
    (__VLS_ctx.mainStore.t.i.captions.user);
    (__VLS_ctx.mainStore.users[place.userid].name
        ? __VLS_ctx.mainStore.users[place.userid].name
        : __VLS_ctx.mainStore.users[place.userid].login);
    var __VLS_78;
    var __VLS_65;
}
var __VLS_3;
// @ts-ignore
var __VLS_10 = __VLS_9, __VLS_28 = __VLS_27;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            LMap: LMap,
            LTileLayer: LTileLayer,
            LMarker: LMarker,
            LTooltip: LTooltip,
            LIcon: LIcon,
            LControlLayers: LControlLayers,
            LPolyline: LPolyline,
            mainStore: mainStore,
            map: map,
            icon_01: icon_01,
            icon_01_blue: icon_01_blue,
            icon_01_green: icon_01_green,
            icon_02: icon_02,
            icon_center: icon_center,
            providers: providers,
            mapCenter: mapCenter,
            dragging: dragging,
            getMeasurePolylineCoords: getMeasurePolylineCoords,
            placemarkClick: placemarkClick,
            placemarkDragStart: placemarkDragStart,
            placemarkDragEnd: placemarkDragEnd,
            updateState: updateState,
            ready: ready,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesMapOpenStreetMap.vue.js.map
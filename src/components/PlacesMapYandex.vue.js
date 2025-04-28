import { ref, shallowRef, watch, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { emitter } from '@/shared/bus';
import { YandexMap, YandexMapMarker, YandexMapDefaultSchemeLayer, YandexMapDefaultFeaturesLayer, createYmapsOptions, YandexMapControls, YandexMapGeolocationControl, YandexMapOpenMapsButton, YandexMapScaleControl, YandexMapZoomControl, } from 'vue-yandex-maps';
import { coords2string } from '@/shared/common';
const mainStore = useMainStore();
const dragging = ref(false);
const map = shallowRef(null);
const markers = shallowRef({});
const markerCenter = shallowRef(null);
createYmapsOptions({ apikey: 'f81dd454-9378-4883-86ae-c84eb24d72d6' });
const placemarksOptions = ref({
    basic: {
        iconLayout: 'default#image',
        iconImageSize: [25, 38],
        iconImageOffset: [0, 0],
    },
    private: {
        draggable: true,
        visible: true,
    },
    common: {
        draggable: false,
        visible: true,
    },
    active: {
        draggable: true,
    },
    center: {
        draggable: true,
        visible: true,
    },
    icon_01: {
        iconImageHref: '/img/markers/marker_01.svg',
    },
    icon_01_green: {
        iconImageHref: '/img/markers/marker_01_green.svg',
    },
    icon_01_blue: {
        iconImageHref: '/img/markers/marker_01_blue.svg',
    },
    icon_02: {
        iconImageHref: '/img/markers/marker_02.svg',
    },
    icon_center: {
        iconImageHref: '/img/markers/marker_center.svg',
    },
});
watch(() => mainStore.placemarksShow, () => {
    if (mainStore.placemarksShow) {
        placemarksOptions.value.private.visible = true;
    }
    else {
        placemarksOptions.value.private.visible = false;
    }
});
watch(() => mainStore.commonPlacemarksShow, () => {
    if (mainStore.commonPlacemarksShow) {
        placemarksOptions.value.common.visible = true;
    }
    else {
        placemarksOptions.value.common.visible = false;
    }
});
watch(() => mainStore.centerPlacemarkShow, () => {
    if (mainStore.centerPlacemarkShow) {
        placemarksOptions.value.center.visible = true;
    }
    else {
        placemarksOptions.value.center.visible = false;
    }
});
const commonPlacesPage = inject('commonPlacesPage');
const commonPlacesOnPageCount = inject('commonPlacesOnPageCount');
const placemarkClick = (id, e) => {
    const place = mainStore.places[id]
        ? mainStore.places[id]
        : mainStore.commonPlaces[id];
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
    if (mainStore.commonPlaces[id]) {
        const inPaginator = Object.keys(mainStore.commonPlaces).indexOf(id) /
            commonPlacesOnPageCount.value;
        commonPlacesPage.value = (Number.isInteger(inPaginator)
            ? inPaginator + 1
            : Math.ceil(inPaginator));
    }
};
const placemarkDragStart = (id) => {
    if (id !== mainStore.currentPlace.id) {
        mainStore.setMessage(mainStore.t.m.popup.needToChoosePlacemark);
    }
};
const placemarkDragEnd = (id) => {
    const coordinates = markers.value[id].coordinates.slice().reverse();
    mainStore.changePlace({
        place: mainStore.places[id],
        change: {
            latitude: Number(coordinates[0].toFixed(7)),
            longitude: Number(coordinates[1].toFixed(7)),
        },
    });
    //	updateState({coords: coordinates});
};
const updateState = (payload) => {
    mainStore.updateMap({
        latitude: Number(payload && payload.coords
            ? payload.coords[0].toFixed(7)
            : map.value.center[1].toFixed(7)),
        longitude: Number(payload && payload.coords
            ? payload.coords[1].toFixed(7)
            : map.value.center[0].toFixed(7)),
        zoom: Number(payload && payload.zoom
            ? payload.zoom
            : map.value.zoom),
    });
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.YandexMap;
/** @type {[typeof __VLS_components.YandexMap, typeof __VLS_components.yandexMap, typeof __VLS_components.YandexMap, typeof __VLS_components.yandexMap, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onMouseup': {} },
    ...{ 'onWheel': {} },
    modelValue: (__VLS_ctx.map),
    settings: ({
        location: {
            center: [
                __VLS_ctx.mainStore.center.longitude,
                __VLS_ctx.mainStore.center.latitude,
            ],
            zoom: __VLS_ctx.mainStore.zoom,
        },
    }),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onMouseup': {} },
    ...{ 'onWheel': {} },
    modelValue: (__VLS_ctx.map),
    settings: ({
        location: {
            center: [
                __VLS_ctx.mainStore.center.longitude,
                __VLS_ctx.mainStore.center.latitude,
            ],
            zoom: __VLS_ctx.mainStore.zoom,
        },
    }),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onMouseup: (__VLS_ctx.updateState)
};
const __VLS_8 = {
    onWheel: (__VLS_ctx.updateState)
};
var __VLS_9 = {};
__VLS_3.slots.default;
const __VLS_10 = {}.YandexMapDefaultFeaturesLayer;
/** @type {[typeof __VLS_components.YandexMapDefaultFeaturesLayer, typeof __VLS_components.yandexMapDefaultFeaturesLayer, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({}));
const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const __VLS_14 = {}.YandexMapDefaultSchemeLayer;
/** @type {[typeof __VLS_components.YandexMapDefaultSchemeLayer, typeof __VLS_components.yandexMapDefaultSchemeLayer, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
if (__VLS_ctx.mainStore.centerPlacemarkShow) {
    const __VLS_18 = {}.YandexMapMarker;
    /** @type {[typeof __VLS_components.YandexMapMarker, typeof __VLS_components.yandexMapMarker, typeof __VLS_components.YandexMapMarker, typeof __VLS_components.yandexMapMarker, ]} */ ;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
        ...{ 'onMouseup': {} },
        modelValue: (__VLS_ctx.markerCenter),
        settings: ({
            coordinates: [
                __VLS_ctx.mainStore.center.longitude,
                __VLS_ctx.mainStore.center.latitude,
            ],
            draggable: true,
        }),
        position: "top-center left-center",
    }));
    const __VLS_20 = __VLS_19({
        ...{ 'onMouseup': {} },
        modelValue: (__VLS_ctx.markerCenter),
        settings: ({
            coordinates: [
                __VLS_ctx.mainStore.center.longitude,
                __VLS_ctx.mainStore.center.latitude,
            ],
            draggable: true,
        }),
        position: "top-center left-center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    let __VLS_22;
    let __VLS_23;
    let __VLS_24;
    const __VLS_25 = {
        onMouseup: (e => {
            e.stopPropagation();
            __VLS_ctx.updateState({
                coords: __VLS_ctx.markerCenter.coordinates.slice().reverse(),
            });
        })
    };
    __VLS_21.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ class: "marker-center" },
        src: (__VLS_ctx.placemarksOptions.icon_center.iconImageHref),
        title: (__VLS_ctx.mainStore.t.i.maps.center),
    });
    var __VLS_21;
}
if (__VLS_ctx.mainStore.placemarksShow) {
    for (const [place, id] of __VLS_getVForSourceType((__VLS_ctx.mainStore.places))) {
        const __VLS_26 = {}.YandexMapMarker;
        /** @type {[typeof __VLS_components.YandexMapMarker, typeof __VLS_components.yandexMapMarker, typeof __VLS_components.YandexMapMarker, typeof __VLS_components.yandexMapMarker, ]} */ ;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
            ...{ 'onClick': {} },
            ...{ 'onContextmenu': {} },
            ...{ 'onMousedown': {} },
            ...{ 'onMouseup': {} },
            ...{ 'onMousemove': {} },
            ...{ 'onMoveend': {} },
            key: (id),
            modelValue: (__VLS_ctx.markers[place.id]),
            settings: ({
                coordinates: [
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].longitude : 0,
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].latitude : 0,
                ],
                draggable: id === __VLS_ctx.mainStore.currentPlace.id,
            }),
            position: "top-center left-center",
        }));
        const __VLS_28 = __VLS_27({
            ...{ 'onClick': {} },
            ...{ 'onContextmenu': {} },
            ...{ 'onMousedown': {} },
            ...{ 'onMouseup': {} },
            ...{ 'onMousemove': {} },
            ...{ 'onMoveend': {} },
            key: (id),
            modelValue: (__VLS_ctx.markers[place.id]),
            settings: ({
                coordinates: [
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].longitude : 0,
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].latitude : 0,
                ],
                draggable: id === __VLS_ctx.mainStore.currentPlace.id,
            }),
            position: "top-center left-center",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        let __VLS_30;
        let __VLS_31;
        let __VLS_32;
        const __VLS_33 = {
            onClick: ((e) => __VLS_ctx.placemarkClick(id, e))
        };
        const __VLS_34 = {
            onContextmenu: ((e) => __VLS_ctx.placemarkClick(id, e))
        };
        const __VLS_35 = {
            onMousedown: (() => __VLS_ctx.dragging = true)
        };
        const __VLS_36 = {
            onMouseup: (() => __VLS_ctx.dragging = false)
        };
        const __VLS_37 = {
            onMousemove: (() => { if (__VLS_ctx.dragging)
                __VLS_ctx.placemarkDragStart(id); })
        };
        const __VLS_38 = {
            onMoveend: (() => __VLS_ctx.placemarkDragEnd(id))
        };
        __VLS_29.slots.default;
        if (place.show && place.geomark) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ class: "marker" },
                src: (__VLS_ctx.placemarksOptions[__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(id) && place !== __VLS_ctx.mainStore.currentPlace
                    ? 'icon_01_blue'
                    : (place === __VLS_ctx.mainStore.currentPlace ? 'icon_01_green' : 'icon_01')].iconImageHref),
                title: (place.name),
            });
        }
        if (__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(place.id)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "marker-caption" },
            });
            (__VLS_ctx.mainStore.measure.places.indexOf(place.id) + 1);
        }
        var __VLS_29;
    }
}
if (__VLS_ctx.mainStore.commonPlacemarksShow) {
    for (const [place, id] of __VLS_getVForSourceType((__VLS_ctx.mainStore.commonPlaces))) {
        const __VLS_39 = {}.YandexMapMarker;
        /** @type {[typeof __VLS_components.YandexMapMarker, typeof __VLS_components.yandexMapMarker, typeof __VLS_components.YandexMapMarker, typeof __VLS_components.yandexMapMarker, ]} */ ;
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
            ...{ 'onClick': {} },
            ...{ 'onContextmenu': {} },
            key: (id),
            modelValue: (__VLS_ctx.markers[place.id]),
            settings: ({
                coordinates: [
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].longitude : 0,
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].latitude : 0,
                ],
                draggable: false,
            }),
            position: "top-center left-center",
        }));
        const __VLS_41 = __VLS_40({
            ...{ 'onClick': {} },
            ...{ 'onContextmenu': {} },
            key: (id),
            modelValue: (__VLS_ctx.markers[place.id]),
            settings: ({
                coordinates: [
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].longitude : 0,
                    __VLS_ctx.mainStore.waypoints[place.waypoint] ? __VLS_ctx.mainStore.waypoints[place.waypoint].latitude : 0,
                ],
                draggable: false,
            }),
            position: "top-center left-center",
        }, ...__VLS_functionalComponentArgsRest(__VLS_40));
        let __VLS_43;
        let __VLS_44;
        let __VLS_45;
        const __VLS_46 = {
            onClick: ((e) => __VLS_ctx.placemarkClick(id, e))
        };
        const __VLS_47 = {
            onContextmenu: ((e) => __VLS_ctx.placemarkClick(id, e))
        };
        __VLS_42.slots.default;
        if (place.geomark) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ class: "marker" },
                src: (__VLS_ctx.placemarksOptions[__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(id) && place !== __VLS_ctx.mainStore.currentPlace
                    ? 'icon_01_blue'
                    : (place === __VLS_ctx.mainStore.currentPlace ? 'icon_01_green' : 'icon_02')].iconImageHref),
                title: (place.name + '\n' + __VLS_ctx.mainStore.t.i.captions.user + ': ' + (__VLS_ctx.mainStore.users[place.userid].name
                    ? __VLS_ctx.mainStore.users[place.userid].name
                    : __VLS_ctx.mainStore.users[place.userid].login)),
            });
        }
        if (__VLS_ctx.mainStore.mode === 'measure' && __VLS_ctx.mainStore.measure.places.includes(place.id)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "marker-caption" },
            });
            (__VLS_ctx.mainStore.measure.places.indexOf(place.id) + 1);
        }
        var __VLS_42;
    }
}
const __VLS_48 = {}.YandexMapControls;
/** @type {[typeof __VLS_components.YandexMapControls, typeof __VLS_components.yandexMapControls, typeof __VLS_components.YandexMapControls, typeof __VLS_components.yandexMapControls, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    settings: ({ position: 'top left' }),
}));
const __VLS_50 = __VLS_49({
    settings: ({ position: 'top left' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.YandexMapGeolocationControl;
/** @type {[typeof __VLS_components.YandexMapGeolocationControl, typeof __VLS_components.yandexMapGeolocationControl, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({}));
const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_56 = {}.YandexMapZoomControl;
/** @type {[typeof __VLS_components.YandexMapZoomControl, typeof __VLS_components.yandexMapZoomControl, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({}));
const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.YandexMapScaleControl;
/** @type {[typeof __VLS_components.YandexMapScaleControl, typeof __VLS_components.yandexMapScaleControl, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
var __VLS_51;
const __VLS_64 = {}.YandexMapControls;
/** @type {[typeof __VLS_components.YandexMapControls, typeof __VLS_components.yandexMapControls, typeof __VLS_components.YandexMapControls, typeof __VLS_components.yandexMapControls, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    settings: ({ position: 'bottom left', orientation: 'vertical' }),
}));
const __VLS_66 = __VLS_65({
    settings: ({ position: 'bottom left', orientation: 'vertical' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.YandexMapOpenMapsButton;
/** @type {[typeof __VLS_components.YandexMapOpenMapsButton, typeof __VLS_components.yandexMapOpenMapsButton, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
var __VLS_67;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['marker-center']} */ ;
/** @type {__VLS_StyleScopedClasses['marker']} */ ;
/** @type {__VLS_StyleScopedClasses['marker-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['marker']} */ ;
/** @type {__VLS_StyleScopedClasses['marker-caption']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            YandexMap: YandexMap,
            YandexMapMarker: YandexMapMarker,
            YandexMapDefaultSchemeLayer: YandexMapDefaultSchemeLayer,
            YandexMapDefaultFeaturesLayer: YandexMapDefaultFeaturesLayer,
            YandexMapControls: YandexMapControls,
            YandexMapGeolocationControl: YandexMapGeolocationControl,
            YandexMapOpenMapsButton: YandexMapOpenMapsButton,
            YandexMapScaleControl: YandexMapScaleControl,
            YandexMapZoomControl: YandexMapZoomControl,
            mainStore: mainStore,
            dragging: dragging,
            map: map,
            markers: markers,
            markerCenter: markerCenter,
            placemarksOptions: placemarksOptions,
            placemarkClick: placemarkClick,
            placemarkDragStart: placemarkDragStart,
            placemarkDragEnd: placemarkDragEnd,
            updateState: updateState,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesMapYandex.vue.js.map
<template>
	<yandex-map
		v-model="map"
		:settings="{
			location: {
				center: [
					mainStore.center.longitude,
					mainStore.center.latitude,
				],
				zoom: mainStore.zoom,
			},
		}"
		@mouseup="updateState"
		@wheel="updateState"
	>
		<yandex-map-default-features-layer />
		<yandex-map-default-scheme-layer />
		<yandex-map-marker
			v-if="mainStore.centerPlacemarkShow"
			v-model="markerCenter"
			:settings="{
				coordinates: [
					mainStore.center.longitude,
					mainStore.center.latitude,
				],
				draggable: true,
			}"
			position="top-center left-center"
			@mouseup="e => {
				e.stopPropagation();
				updateState({
					coords: markerCenter.coordinates.slice().reverse(),
				});
			}"
		>
			<img
				class="marker"
				:src="placemarksOptions.icon_06.iconImageHref"
			>
		</yandex-map-marker>
		<yandex-map-marker
			v-for="(place, id) in mainStore.places"
			v-if="mainStore.placemarksShow"
			:key="id"
			v-model="markers[place.id]"
			:settings="{
				coordinates: [
					mainStore.waypoints[place.waypoint] ? mainStore.waypoints[place.waypoint].longitude : 0,
					mainStore.waypoints[place.waypoint] ? mainStore.waypoints[place.waypoint].latitude : 0,
				],
				draggable: true,
			}"
			position="top-center left-center"
			@click="placemarkClick(place.id)"
			@mouseup="placemarkDragEnd(place.id)"
		>
			<img
				v-if="place.show && place.geomark"
				class="marker"
				:src="placemarksOptions[mainStore.currentPlace && id === mainStore.currentPlace.id ? 'icon_06' : 'icon_04'].iconImageHref"
			>
		</yandex-map-marker>
		<yandex-map-marker
			v-for="(place, id) in mainStore.commonPlaces"
			v-if="mainStore.commonPlacemarksShow"
			:key="id"
			v-model="markers[place.id]"
			:settings="{
				coordinates: [
					mainStore.waypoints[place.waypoint] ? mainStore.waypoints[place.waypoint].longitude : 0,
					mainStore.waypoints[place.waypoint] ? mainStore.waypoints[place.waypoint].latitude : 0,
				],
				draggable: false,
			}"
			position="top-center left-center"
			@click="placemarkClick(place.id)"
		>
			<img
				v-if="place.geomark"
				class="marker"
				:src="placemarksOptions[mainStore.currentPlace && id === mainStore.currentPlace.id ? 'icon_06' : 'icon_05'].iconImageHref"
			>
		</yandex-map-marker>
		<yandex-map-controls :settings="{position: 'top left'}">
			<yandex-map-geolocation-control />
			<yandex-map-zoom-control />
			<yandex-map-scale-control />
		</yandex-map-controls>
		<yandex-map-controls :settings="{position: 'bottom left', orientation: 'vertical'}">
			<yandex-map-open-maps-button />
		</yandex-map-controls>
	</yandex-map>
</template>

<script setup lang="ts">
import { ref, Ref, shallowRef, watch, inject } from 'vue';
import { useMainStore } from '@/stores/main';;
import { emitter } from '@/shared/bus';
import {
	YandexMap,
	YandexMapMarker,
	YandexMapDefaultSchemeLayer,
	YandexMapDefaultFeaturesLayer,
	createYmapsOptions,
	YandexMapControls,
	YandexMapGeolocationControl,
	YandexMapOpenMapsButton,
	YandexMapScaleControl,
	YandexMapZoomControl,
} from 'vue-yandex-maps';
import type { YMap } from '@yandex/ymaps3-types';

const mainStore = useMainStore();

const map = shallowRef<YMap | null>(null);
const markers = shallowRef({});
const markerCenter = shallowRef(null);
createYmapsOptions({apikey: 'f81dd454-9378-4883-86ae-c84eb24d72d6'});

const placemarksOptions = ref({
	basic: {
		iconLayout: 'default#image',
		iconImageSize: [25, 38],
		iconImageOffset: [0, -34],
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
	icon_04: {
		iconImageHref: '/img/markers/marker_04.svg',
	},
	icon_05: {
		iconImageHref: '/img/markers/marker_05.svg',
	},
	icon_06: {
		iconImageHref: '/img/markers/marker_01_green.svg',
	},
});

watch(() => mainStore.placemarksShow, () => {
	if (mainStore.placemarksShow) {
		placemarksOptions.value.private.visible = true;
	} else {
		placemarksOptions.value.private.visible = false;
	}
});
watch(() => mainStore.commonPlacemarksShow, () => {
	if (mainStore.commonPlacemarksShow) {
		placemarksOptions.value.common.visible = true;
	} else {
		placemarksOptions.value.common.visible = false;
	}
});
watch(() => mainStore.centerPlacemarkShow, () => {
	if (mainStore.centerPlacemarkShow) {
		placemarksOptions.value.center.visible = true;
	} else {
		placemarksOptions.value.center.visible = false;
	}
});

const commonPlacesPage = inject('commonPlacesPage');
const commonPlacesOnPageCount = inject('commonPlacesOnPageCount');

const placemarkClick = (id: string): void => {
	let place = null;
	if (mainStore.places[id]) place = mainStore.places[id];
	if (mainStore.commonPlaces[id]) place = mainStore.commonPlaces[id];
	emitter.emit(
		'setCurrentPlace',
		{place: place}
	);
	if (place.common) {
		const inPaginator =
			Object.keys(mainStore.commonPlaces).indexOf(id) /
			(commonPlacesOnPageCount as Ref).value
		;
		(commonPlacesPage as Ref).value = (
			Number.isInteger(inPaginator)
				? inPaginator + 1
				: Math.ceil(inPaginator)
		);
	}
};
const placemarkDragEnd = (id: string): void => {
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
const updateState = (payload?: {coords?: Array<number>, zoom?: number}): void => {
	mainStore.updateMap({
		latitude: Number(
			payload && payload.coords
				? payload.coords[0].toFixed(7)
				: map.value.center[1].toFixed(7)
		),
		longitude: Number(
			payload && payload.coords
				? payload.coords[1].toFixed(7)
				: map.value.center[0].toFixed(7)
		),
		zoom: Number(
			payload && payload.zoom
				? payload.zoom
				: map.value.zoom
		),
	});
};
</script>

<style scoped>
.marker {
	cursor: pointer;
	max-width: unset;
	width: 25px;
	height: 38px;
}
</style>

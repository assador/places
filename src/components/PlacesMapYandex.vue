<template>
	<yandex-map
		v-model="map"
		:settings="{
			apikey: '264f4333-26ea-4342-af02-67c24d0533e7',
			location: {
				center: [
					store.state.center.longitude,
					store.state.center.latitude,
				],
				zoom: store.state.zoom,
			},
		}"
		@mouseup="updateState"
		@wheel="updateState"
	>
		<yandex-map-default-features-layer />
		<yandex-map-default-scheme-layer />
		<yandex-map-marker
			v-if="store.state.centerPlacemarkShow"
			v-model="markerCenter"
			:settings="{
				coordinates: [
					store.state.center.longitude,
					store.state.center.latitude,
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
			v-for="(place, id) in store.state.places"
			v-if="store.state.placemarksShow"
			:key="id"
			v-model="markers[place.id]"
			:settings="{
				coordinates: [
					store.state.waypoints[place.waypoint] ? store.state.waypoints[place.waypoint].longitude : 0,
					store.state.waypoints[place.waypoint] ? store.state.waypoints[place.waypoint].latitude : 0,
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
				:src="placemarksOptions[store.state.currentPlace && id === store.state.currentPlace.id ? 'icon_06' : 'icon_04'].iconImageHref"
			>
		</yandex-map-marker>
		<yandex-map-marker
			v-for="(place, id) in store.state.commonPlaces"
			v-if="store.state.commonPlacemarksShow"
			:key="id"
			v-model="markers[place.id]"
			:settings="{
				coordinates: [
					store.state.waypoints[place.waypoint] ? store.state.waypoints[place.waypoint].longitude : 0,
					store.state.waypoints[place.waypoint] ? store.state.waypoints[place.waypoint].latitude : 0,
				],
				draggable: false,
			}"
			position="top-center left-center"
			@click="placemarkClick(place.id)"
		>
			<img
				v-if="place.geomark"
				class="marker"
				:src="placemarksOptions[store.state.currentPlace && id === store.state.currentPlace.id ? 'icon_06' : 'icon_05'].iconImageHref"
			>
		</yandex-map-marker>
		<yandex-map-controls :settings="{position: 'top left'}">
			<yandex-map-geolocation-control />
			<yandex-map-zoom-control />
			<yandex-map-scale-control />
		</yandex-map-controls>
		<yandex-map-controls :settings="{position: 'top right', orientation: 'vertical'}">
			<yandex-map-control-button :settings="{onClick: toggleFullscreen}">
				<div
					class="fullscreen"
					:class="{'exit-fullscreen': isFullscreen}"
				>
					⤧
				</div>
			</yandex-map-control-button>
		</yandex-map-controls>
		<yandex-map-controls :settings="{position: 'bottom left', orientation: 'vertical'}">
			<yandex-map-open-maps-button />
		</yandex-map-controls>
	</yandex-map>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted, onBeforeUnmount, inject } from 'vue';
import { useStore } from 'vuex';
import { emitter } from '@/shared/bus';
import {
	YandexMap,
	YandexMapMarker,
	YandexMapDefaultSchemeLayer,
	YandexMapDefaultFeaturesLayer,
	createYmapsOptions,
	YandexMapControlButton,
	YandexMapControls,
	YandexMapGeolocationControl,
	YandexMapOpenMapsButton,
	YandexMapScaleControl,
	YandexMapZoomControl,
} from 'vue-yandex-maps';
import type { YMap } from '@yandex/ymaps3-types';

const store = useStore();

const map = shallowRef<YMap | null>(null);
const markers = shallowRef<Record<string, typeof YandexMapMarker | null>>({});
const markerCenter = shallowRef<typeof YandexMapMarker | null>(null);
createYmapsOptions({apikey: 'f81dd454-9378-4883-86ae-c84eb24d72d6'});

const placemarksOptions = ref({
	basic: {
		iconLayout: 'default#image',
		iconImageSize: [25, 38],
		iconImageOffset: [0, -34],
	},
	private: {
		draggable: true,
	},
	common: {
		draggable: false,
	},
	active: {
		draggable: true,
	},
	center: {
		draggable: true,
	},
	icon_04: {
		iconImageHref: '/img/markers/marker_04.svg',
	},
	icon_05: {
		iconImageHref: '/img/markers/marker_05.svg',
	},
	icon_06: {
		iconImageHref: '/img/markers/marker_06.svg',
	},
});

watch(() => store.state.placemarksShow, () => {
	if (store.state.placemarksShow) {
		placemarksOptions.value.private.visible = true;
	} else {
		placemarksOptions.value.private.visible = false;
	}
});
watch(() => store.state.commonPlacemarksShow, () => {
	if (store.state.commonPlacemarksShow) {
		placemarksOptions.value.common.visible = true;
	} else {
		placemarksOptions.value.common.visible = false;
	}
});
watch(() => store.state.centerPlacemarkShow, () => {
	if (store.state.centerPlacemarkShow) {
		placemarksOptions.value.center.visible = true;
	} else {
		placemarksOptions.value.center.visible = false;
	}
});

const commonPlacesPage = inject('commonPlacesPage');
const commonPlacesOnPageCount = inject('commonPlacesOnPageCount');

const placemarkClick = (id: string): void => {
	let place = null;
	if (store.state.places[id]) place = store.state.places[id];
	if (store.state.commonPlaces[id]) place = store.state.commonPlaces[id];
	emitter.emit(
		'setCurrentPlace',
		{place: place}
	);
	if (place.common) {
		const inPaginator =
			Object.keys(store.state.commonPlaces).indexOf(id) /
			commonPlacesOnPageCount.value
		;
		commonPlacesPage.value = (
			Number.isInteger(inPaginator)
				? inPaginator + 1
				: Math.ceil(inPaginator)
		);
	}
};
const placemarkDragEnd = (id: string): void => {
	placemarkClick(id);
	if (id === store.state.currentPlace.id) {
		const coordinates = markers.value[id].coordinates.slice().reverse();
		store.dispatch('changePlace', {
			place: store.state.places[id],
			change: {
				latitude: Number(coordinates[0].toFixed(7)),
				longitude: Number(coordinates[1].toFixed(7)),
			},
		});
		updateState({coords: coordinates});
	}
};
const updateState = (payload?: {coords?: Array<number>, zoom?: number}): void => {
	store.dispatch('updateMap', {
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

const isFullscreen = ref(false);

const toggleFullscreen = () => {
	if (isFullscreen.value) {
		document.exitFullscreen();
	} else {
		map.value!.container.requestFullscreen();
	}
};
onMounted(() => {
	const handleFullscreenChange = () => {
		isFullscreen.value = !!document.fullscreenElement;
	};
	document.addEventListener('fullscreenchange', handleFullscreenChange);
	onBeforeUnmount(() => {
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
	});
});
</script>

<style scoped>
.marker {
	cursor: pointer;
	max-width: unset;
	width: 25px;
	height: 38px;
}
</style>

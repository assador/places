<template>
	<yandex-map
		id="mapblock"
		v-model="map"
		:settings="{
			location: {
				center: mapCenter.coords,
				zoom: mapCenter.zoom,
			},
		}"
		@map-was-initialized="mapHandler"
		@mouseup="updateState"
		@wheel="updateState"
	>
		<yandex-map-default-features-layer />
		<yandex-map-default-scheme-layer />
<!--
		<ymap-marker
			ref="centerMarker"
			marker-id="centerMarker"
			:coords="mapCenter.coords"
			:hint-content="store.state.t.i.maps.center"
			:balloon="{body: store.state.t.i.maps.centerExt}"
			:options="{
				visible: centerPlacemarkShow,
				...placemarksOptions.basic,
				...placemarksOptions.center,
				...placemarksOptions.icon_06,
			}"
			@dragend="e => {
				updateState({
					coords: e.originalEvent.target.geometry._coordinates,
				});
			}"
		/>
		<ymap-marker
			v-for="(place, id) in places"
			:key="id"
			:marker-id="place.id"
			:coords="[
				waypoints[place.waypoint] ? waypoints[place.waypoint].latitude : 0,
				waypoints[place.waypoint] ? waypoints[place.waypoint].longitude : 0,
			]"
			:hint-content="place.name"
			:balloon="{body: place.description}"
			:options="{
				visible: placemarksShow && place.show && place.geomark,
				...placemarksOptions.basic,
				...placemarksOptions.private,
				...placemarksOptions[currentPlace && id === currentPlace.id ? 'icon_06' : 'icon_04'],
			}"
			:properties="{
				place: place,
			}"
			@click="e => {placemarkClick(e);}"
			@dragstart="e => {placemarkDragStart(e);}"
			@dragend="e => {placemarkDragEnd(e);}"
		/>
		<ymap-marker
			v-for="(place, id) in commonPlaces"
			:key="id"
			:marker-id="place.id"
			:coords="[waypoints[place.waypoint].latitude, waypoints[place.waypoint].longitude]"
			:hint-content="place.name"
			:balloon="{body: place.description}"
			:options="{
				visible: commonPlacemarksShow && place.show && place.geomark,
				...placemarksOptions.basic,
				...placemarksOptions.common,
				...placemarksOptions[currentPlace && id === currentPlace.id ? 'icon_06' : 'icon_05'],
			}"
			:properties="{
				place: place,
			}"
			@click="e => {placemarkClick(e);}"
		/>
-->
	</yandex-map>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, inject } from 'vue';
import { useStore } from 'vuex';
import { emitter } from '@/shared/bus';
import { ResizeSensor } from 'css-element-queries';
import type { YMap } from '@yandex/ymaps3-types';
import { YandexMap, YandexMapDefaultSchemeLayer, YandexMapDefaultFeaturesLayer, YandexMapMarker } from 'vue-yandex-maps';
import { Place, Waypoint } from '@/store/types';

const store = useStore();

const map = inject('extmap');
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
const updatingMap = ref(false);

const currentPlace = computed(() => store.state.currentPlace);
const placemarksShow = computed(() => store.state.placemarksShow);
const commonPlacemarksShow = computed(() => store.state.commonPlacemarksShow);
const centerPlacemarkShow = computed(() => store.state.centerPlacemarkShow);
const places = computed(() => store.state.places);
const commonPlaces = computed(() => store.state.commonPlaces);
const waypoints = computed(() => store.state.waypoints);
const mapCenter = computed(() => ({
	coords: [
		store.state.center.latitude,
		store.state.center.longitude,
	],
	zoom: store.state.zoom,
}));

watch(() => placemarksShow.value, () => {
	if (placemarksShow.value) {
		placemarksOptions.value.private.visible = true;
	} else {
		placemarksOptions.value.private.visible = false;
	}
});
watch(() => commonPlacemarksShow.value, () => {
	if (commonPlacemarksShow.value) {
		placemarksOptions.value.common.visible = true;
	} else {
		placemarksOptions.value.common.visible = false;
	}
});
watch(() => centerPlacemarkShow.value, () => {
	if (centerPlacemarkShow.value) {
		placemarksOptions.value.center.visible = true;
	} else {
		placemarksOptions.value.center.visible = false;
	}
});

const commonPlacesShowHide = inject('commonPlacesShowHide');
const commonPlacesPage = inject('commonPlacesPage');
const commonPlacesOnPageCount = inject('commonPlacesOnPageCount');
const compact = inject('compact');

map.value = shallowRef<null | YMap>(null);
const mapHandler = (map): void => {
	map.value = map;
	map.value.controls.add('routeButtonControl', {});
	map.value.behaviors.enable('scrollZoom');
	commonPlacesShowHide(
		store.state.commonPlacemarksShow
	);
};
const placemarkClick = (e): void => {
	e.get('target').options.set(
		'draggable',
		e.get('target').properties.get('place.common') ? false : true
	);
	emitter.emit(
		'setCurrentPlace',
		{place: e.get('target').properties.get('place')}
	);
	if (e.get('target').properties.get('place.common')) {
		const inPaginator =
			Object.keys(commonPlaces.value)
				.indexOf(e.get('target').properties.get('place.id')) /
				commonPlacesOnPageCount.value
		;
		commonPlacesPage.value = (
			Number.isInteger(inPaginator)
				? inPaginator + 1
				: Math.ceil(inPaginator)
		);
	}
};
const placemarkDragStart = (e): void => {
	if (e.get('target').properties.get('place.id') !== currentPlace.value.id) {
		e.get('target').options.set({draggable: false});
		store.dispatch('setMessage',
			store.state.t.m.popup.needToChoosePlacemark
		);
	}
};
const placemarkDragEnd = (e): void => {
	e.get('target').options.set({draggable: true});
	if (e.get('target').properties.get('place.id') === currentPlace.value.id) {
		const coordinates = e.get('target').geometry.getCoordinates();
		store.dispatch('changePlace', {
			place: e.get('target').properties.get('place'),
			change: {
				latitude: Number(coordinates[0].toFixed(7)),
				longitude: Number(coordinates[1].toFixed(7)),
			},
		});
		updateState({coords: coordinates});
	}
};
const updateState = (payload?: {coords: Array<number>, zoom: number}): void => {
	store.dispatch('updateMap', {
		latitude: Number(
			payload && payload.coords
				? payload.coords[0].toFixed(7)
				: map.value.myMap.getCenter()[0].toFixed(7)
		),
		longitude: Number(
			payload && payload.coords
				? payload.coords[1].toFixed(7)
				: map.value.myMap.getCenter()[1].toFixed(7)
		),
		zoom: Number(
			payload && payload.zoom
				? payload.zoom
				: map.value.myMap.getZoom()
		),
	});
};
</script>

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
				class="marker-center"
				:src="placemarksOptions.icon_center.iconImageHref"
				:title="mainStore.t.i.maps.center"
			/>
		</yandex-map-marker>
		<yandex-map-marker
			v-for="(point, id) in mainStore.temps"
			v-if="mainStore.placemarksShow"
			:key="id"
			v-model="markers[point.id]"
			:settings="{
				coordinates: [point.longitude, point.latitude],
				draggable: point === mainStore.currentPoint,
			}"
			position="top-center left-center"
			@mousedown="(e: Event) => placemarkDragStart(point)"
			@mouseup="async (e: Event) => {
				placemarkDragEnd(point);
				placemarkClick(point, e);
			}"
			@contextmenu="(e: Event) => placemarkClick(point, e)"
		>
			<img
				v-if="point.show"
				class="marker"
				:src="placemarksOptions[
					mainStore.mode === 'measure' &&
					mainStore.measure.points.includes(id) &&
					point !== mainStore.currentPoint
						? 'icon_01_blue_faded'
						: (point === mainStore.currentPoint
							? 'icon_01_green_faded'
							: 'icon_01_faded')
				].iconImageHref"
				:title="`${ mainStore.t.i.captions.measurePoint } ${ Object.keys(mainStore.temps).indexOf(point.id) + 1 } — ${ coords2string([point.latitude, point.longitude]) }`"
			/>
			<div
				v-if="mainStore.mode === 'measure' && mainStore.measure.points.includes(point.id)"
				class="marker-caption"
			>
				{{ mainStore.measure.points.indexOf(point.id) + 1 }}
			</div>
		</yandex-map-marker>
		<yandex-map-marker
			v-for="(place, id) in mainStore.places"
			v-if="mainStore.placemarksShow"
			:key="id"
			v-model="markers[place.id]"
			:settings="{
				coordinates: [
					mainStore.points[place.pointid]
						? mainStore.points[place.pointid].longitude : 0,
					mainStore.points[place.pointid]
						? mainStore.points[place.pointid].latitude : 0,
				],
				draggable: true,
			}"
			position="top-center left-center"
			@mousedown="(e: Event) => placemarkDragStart(place)"
			@mouseup="(e: Event) => {
				placemarkDragEnd(place);
				placemarkClick(place, e);
			}"
			@contextmenu="(e: Event) => placemarkClick(place, e)"
		>
			<img
				v-if="place.show && !!place.geomark"
				class="marker"
				:src="placemarksOptions[
					mainStore.mode === 'measure' && mainStore.measure.points.includes(id) && place !== mainStore.currentPlace
						? 'icon_01_blue'
						: (place === mainStore.currentPlace ? 'icon_01_green' : 'icon_01')
				].iconImageHref"
				:title="place.name"
			/>
			<div
				v-if="mainStore.mode === 'measure' && mainStore.measure.points.includes(place.id)"
				class="marker-caption"
			>
				{{ mainStore.measure.points.indexOf(place.id) + 1 }}
			</div>
		</yandex-map-marker>
		<yandex-map-marker
			v-for="(place, id) in mainStore.commonPlaces"
			v-if="mainStore.commonPlacemarksShow"
			:key="id"
			v-model="markers[place.id]"
			:settings="{
				coordinates: [
					mainStore.points[place.pointid]
						? mainStore.points[place.pointid].longitude : 0,
					mainStore.points[place.pointid]
						? mainStore.points[place.pointid].latitude : 0,
				],
				draggable: false,
			}"
			position="top-center left-center"
			@click="(e: Event) => placemarkClick(place, e)"
			@contextmenu="(e: Event) => placemarkClick(place, e)"
		>
			<img
				v-if="!!place.geomark"
				class="marker"
				:src="placemarksOptions[
					mainStore.mode === 'measure' && mainStore.measure.points.includes(id) && place !== mainStore.currentPlace
						? 'icon_01_blue'
						: (place === mainStore.currentPlace ? 'icon_01_green' : 'icon_01_grey')
				].iconImageHref"
				:title="place.name + '\n' + mainStore.t.i.captions.user + ': ' + (
					mainStore.users[place.userid].name
						? mainStore.users[place.userid].name
						: mainStore.users[place.userid].login
				)"
			/>
			<div
				v-if="mainStore.mode === 'measure' && mainStore.measure.points.includes(place.id)"
				class="marker-caption"
			>
				{{ mainStore.measure.points.indexOf(place.id) + 1 }}
			</div>
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
import { useMainStore } from '@/stores/main';
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
import { Place, Point } from '@/stores/types';
import { coords2string, generateRandomString } from '@/shared/common';

const mainStore = useMainStore();

const dragging = ref(false);

const map = shallowRef<YMap | null>(null);
const markers = shallowRef({});
const markerCenter = shallowRef(null);
createYmapsOptions({apikey: 'f81dd454-9378-4883-86ae-c84eb24d72d6'});

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
	icon_01_faded: {
		iconImageHref: '/img/markers/marker_01_faded.svg',
	},
	icon_01_grey: {
		iconImageHref: '/img/markers/marker_01_grey.svg',
	},
	icon_01_green: {
		iconImageHref: '/img/markers/marker_01_green.svg',
	},
	icon_01_green_faded: {
		iconImageHref: '/img/markers/marker_01_green_faded.svg',
	},
	icon_01_blue: {
		iconImageHref: '/img/markers/marker_01_blue.svg',
	},
	icon_01_blue_faded: {
		iconImageHref: '/img/markers/marker_01_blue_faded.svg',
	},
	icon_center: {
		iconImageHref: '/img/markers/marker_center.svg',
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
const choosePlace = inject('choosePlace') as (...args: any[]) => any;

const mapContextMenu = (e: any): void => {
	mainStore.addTemp({
		id: crypto.randomUUID(),
		userid: sessionStorage.getItem('places-useruuid'),
		latitude: e.get('coords')[0],
		longitude: e.get('coords')[2],
		common: false,
		type: 'point',
		added: false,
		deleted: false,
		updated: false,
		show: true,
	});
}
const placemarkClick = (point: Place | Point, e: Event): void => {
	switch (point.type) {
		case 'point':
			switch (mainStore.mode) {
				case 'measure':
					emitter.emit('choosePoint', {
						point: point,
						mode: (e.type === 'contextmenu' ? 'measure' : 'normal'),
					});
					break;
				default:
					if (e.type === 'contextmenu') {
						mainStore.setMessage(
							coords2string([point['latitude'], point['longitude']]),
							true
						);
					} else {
						emitter.emit('choosePoint', {point: point});
					}
					break;
			}
			break;
		default:
			switch (mainStore.mode) {
				case 'measure':
					choosePlace(point, e.type === 'contextmenu' ? 'measure' : 'normal');
					break;
				default:
					if (e.type === 'contextmenu') {
						mainStore.setMessage(point['name'], true);
						mainStore.setMessage(
							coords2string([
								mainStore.points[point['point']].latitude,
								mainStore.points[point['point']].longitude
							]),
							true
						);
						mainStore.setMessage(point['description'], true);
					} else {
						choosePlace(point);
					}
					break;
			}
			if (point.common) {
				const inPaginator =
					Object.keys(mainStore.commonPlaces).indexOf(point.id) /
					(commonPlacesOnPageCount as Ref).value
				;
				(commonPlacesPage as Ref).value = (
					Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
				);
			}
			break;
	}
};
const placemarkDragStart = (place: Place | Point): void => {
/*
	if (place !== mainStore.currentPlace) {
		mainStore.setMessage(
			mainStore.t.m.popup.needToChoosePlacemark
		);
	}
*/
};
const placemarkDragEnd = async (point: Place | Point) => {
	const coordinates = markers.value[point.id].coordinates.slice().reverse();
	await mainStore[point.type === 'point' ? 'changePoint' : 'changePlace']({
		[point.type === 'point' ? 'point' : 'place']: point,
		change: {
			latitude: Number(coordinates[0].toFixed(7)),
			longitude: Number(coordinates[1].toFixed(7)),
		},
	});
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
	margin: -63px 0 0 -23px;
}
.marker-center {
	cursor: pointer;
	max-width: unset;
	width: 50px;
	height: 50px;
	margin: -25px 0 0 -25px;
}
.marker-caption {
	position: absolute;
	top: -15px; left: -7px;
}
</style>

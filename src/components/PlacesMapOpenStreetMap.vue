<template>
	<div id="mapblock">
		<l-map
			ref="map"
			v-model:zoom="mapCenter.zoom"
			:center="mapCenter.coords"
			@ready="ready()"
			@moveend="updateState()"
		>
			<l-control-layers />
			<l-tile-layer
				v-for="(provider, index) in providers"
				:key="'key' + index"
				:name="provider.name"
				:url="provider.url"
				:visible="provider.visible"
				layer-type="base"
			/>
			<l-marker
				ref="centerMarker"
				:lat-lng="mapCenter.coords"
				draggable
				:visible="mainStore.centerPlacemarkShow ? true : false"
				@moveend="e => updateState({
					coords: [
						e.target.getLatLng().lat,
						e.target.getLatLng().lng,
					],
				})"
			>
				<l-icon v-bind="icon_center" />
				<l-tooltip>
					{{ mainStore.t.i.maps.center }}
				</l-tooltip>
			</l-marker>
			<l-marker
				v-for="(place, id) in mainStore.places"
				:key="id"
				:lat-lng="[
					mainStore.waypoints[place.waypoint] ? mainStore.waypoints[place.waypoint].latitude : 0,
					mainStore.waypoints[place.waypoint] ? mainStore.waypoints[place.waypoint].longitude : 0,
				]"
				:draggable="id === mainStore.currentPlace.id"
				:visible="mainStore.placemarksShow && place.show && place.geomark ? true : false"
				@click="e => placemarkClick(place, e.originalEvent)"
				@contextmenu="e => placemarkClick(place, e.originalEvent)"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@mousemove="e => {if (dragging) placemarkDragStart(place);}"
				@drop="e => placemarkDragEnd(place, e)"
			>
				<l-icon
					v-bind="
						mainStore.mode === 'measure' && mainStore.measure.places.includes(id) && place !== mainStore.currentPlace
							? icon_01_blue
							: (place === mainStore.currentPlace ? icon_01_green : icon_01)
					"
				/>
				<l-tooltip permanent="true">
					{{ place.name }}
				</l-tooltip>
			</l-marker>
			<l-polyline
				v-if="mainStore.mode === 'measure' && mainStore.measure.places.length"
				:lat-lngs="getMeasurePolylineCoords()"
				color="rgba(0, 0, 0, 1)"
				:weight="0.5"
			>
			</l-polyline>
			<l-marker
				v-for="(place, id) in mainStore.commonPlaces"
				:key="id"
				:lat-lng="[
					mainStore.waypoints[place.waypoint].latitude,
					mainStore.waypoints[place.waypoint].longitude,
				]"
				:visible="mainStore.commonPlacemarksShow && place.geomark ? true : false"
				@click="e => placemarkClick(place, e.originalEvent)"
				@contextmenu="e => placemarkClick(place, e.originalEvent)"
			>
				<l-icon
					v-bind="
						mainStore.mode === 'measure' && mainStore.measure.places.includes(id) && place !== mainStore.currentPlace
							? icon_01_blue
							: (place === mainStore.currentPlace ? icon_01_green : icon_02)
					"
				/>
				<l-tooltip>
					{{ place.name }}<br />
					{{ mainStore.t.i.captions.user }}: {{
						mainStore.users[place.userid].name
							? mainStore.users[place.userid].name
							: mainStore.users[place.userid].login
					}}
				</l-tooltip>
			</l-marker>
		</l-map>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { emitter } from '@/shared/bus';
import {
	LMap,
	LTileLayer,
	LMarker,
	LTooltip,
	LIcon,
	LControlLayers,
	LPolyline,
/*
	LPopup,
	LPolygon,
	LRectangle,
*/
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from '@/stores/types';
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

const getMeasurePolylineCoords = (): number[][] => {
	const coords: number[][] = [];
	let place: Place;
	for (const idx in mainStore.measure.places) {
		if (mainStore.places[mainStore.measure.places[idx]]) {
			place = mainStore.places[mainStore.measure.places[idx]];
		} else {
			place = mainStore.commonPlaces[mainStore.measure.places[idx]];
		}
		coords.push([
			mainStore.waypoints[place.waypoint].latitude,
			mainStore.waypoints[place.waypoint].longitude,
		]);
	}
	return coords;
}
const placemarkClick = (place: Place, e: Event): void => {
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
				mainStore.setMessage(
					coords2string([
						mainStore.waypoints[place.waypoint].latitude,
						mainStore.waypoints[place.waypoint].longitude
					]),
					true
				);
				mainStore.setMessage(place.description, true);
			} else {
				emitter.emit('choosePlace', {place: place});
			}
			break;
	}
	if (place.common) {
		const inPaginator =
			Object.keys(mainStore.commonPlaces).indexOf(place.id) /
			(commonPlacesOnPageCount as Ref).value
		;
		(commonPlacesPage as Ref).value = (
			Number.isInteger(inPaginator)
				? inPaginator + 1
				: Math.ceil(inPaginator)
		);
	}
};
const placemarkDragStart = (place: Place): void => {
	if (place !== mainStore.currentPlace) {
		mainStore.setMessage(
			mainStore.t.m.popup.needToChoosePlacemark
		);
	}
};
const placemarkDragEnd = (place: Place, event: any): void => {
	const coordinates = event.target.getLatLng();
	mainStore.changePlace({
		place: place,
		change: {
			latitude: Number(coordinates.lat.toFixed(7)),
			longitude: Number(coordinates.lng.toFixed(7)),
		},
	});
};
const updateState = (payload?: {coords?: Array<number>, zoom?: number}): void => {
	mainStore.updateMap({
		latitude: Number(
			payload && payload.coords
				? payload.coords[0].toFixed(7)
				: (map as Ref).value.leafletObject.getCenter().lat.toFixed(7)
		),
		longitude: Number(
			payload && payload.coords
				? payload.coords[1].toFixed(7)
				: (map as Ref).value.leafletObject.getCenter().lng.toFixed(7)
		),
		zoom: Number(
			payload && payload.zoom
				? payload.zoom
				: (map as Ref).value.leafletObject.getZoom()
		),
	});
};
const ready = (): void => {
	(map as Ref).value.leafletObject.panTo(mapCenter.value.coords);
};
</script>

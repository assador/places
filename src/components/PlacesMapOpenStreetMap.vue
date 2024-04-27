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
				:visible="centerPlacemarkShow ? true : false"
				@moveend="e => updateState({
					coords: [
						e.target.getLatLng().lat,
						e.target.getLatLng().lng,
					],
				})"
			>
				<l-icon v-bind="icon_03" />
				<l-tooltip>
					{{ store.state.t.i.maps.center }}
				</l-tooltip>
			</l-marker>
			<l-marker
				v-for="(place, id) in places"
				:key="id"
				:lat-lng="[
					waypoints[place.waypoint] ? waypoints[place.waypoint].latitude : 0,
					waypoints[place.waypoint] ? waypoints[place.waypoint].longitude : 0,
				]"
				draggable
				:visible="placemarksShow && place.show && place.geomark ? true : false"
				@click="placemarkClick(place)"
				@mousedown="e => placemarkDragStart(place, e)"
				@mouseup="e => placemarkDragEnd(place, e)"
			>
				<l-icon v-bind="place === currentPlace ? icon_03 : icon_01" />
				<l-tooltip>
					{{ place.name }}
				</l-tooltip>
			</l-marker>
			<l-marker
				v-for="(place, id) in commonPlaces"
				:key="id"
				:lat-lng="[
					waypoints[place.waypoint].latitude,
					waypoints[place.waypoint].longitude,
				]"
				:visible="commonPlacemarksShow && place.geomark ? true : false"
				@click="placemarkClick(place);"
			>
				<l-icon v-bind="place === currentPlace ? icon_03 : icon_02" />
				<l-tooltip>
					{{ place.name }}
				</l-tooltip>
			</l-marker>
		</l-map>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useStore } from 'vuex';
import { emitter } from '@/shared/bus';
import {
	LMap,
	LTileLayer,
	LMarker,
	LTooltip,
	LIcon,
	LControlLayers,
/*
	LPopup,
	LPolyline,
	LPolygon,
	LRectangle,
*/
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";

const store = useStore();

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
const icon_02 = ref({
	iconUrl: '/img/markers/marker_02.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_03 = ref({
	iconUrl: '/img/markers/marker_03.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const providers = ref([{
	name: store.state.t.i.maps.osm,
	url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	visible: true,
}, {
	name: store.state.t.i.maps.satellite,
	url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	visible: false,
}, {
	name: store.state.t.i.maps.topography,
	url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
	visible: false,
}, {
	name: store.state.t.i.maps.tourists,
	url: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
	visible: false,
}, {
	name: store.state.t.i.maps.transport,
	url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
	visible: false,
}, {
	name: store.state.t.i.maps.aero,
	url: 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
	visible: false,
}, {
	name: store.state.t.i.maps.bicycles,
	url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
	visible: false,
}, {
	name: store.state.t.i.maps.railroads,
	url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
	visible: false,
}]);

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

const commonPlacesPage = inject('commonPlacesPage');
const commonPlacesOnPageCount = inject('commonPlacesOnPageCount');

const placemarkClick = (place): void => {
	emitter.emit('setCurrentPlace', {place: place});
	if (place.common) {
		const inPaginator =
			Object.keys(store.state.commonPlaces).indexOf(place.id) /
			commonPlacesOnPageCount.value
		;
		commonPlacesPage.value = (
			Number.isInteger(inPaginator)
				? inPaginator + 1
				: Math.ceil(inPaginator)
		);
	}
};
const placemarkDragStart = (place, event): void => {
	if (place !== currentPlace.value) {
		event.target.dragging.disable();
		store.dispatch('setMessage',
			store.state.t.m.popup.needToChoosePlacemark
		);
	}
};
const placemarkDragEnd = (place, event): void => {
	event.target.dragging.enable();
	const coordinates = event.target.getLatLng();
	store.dispatch('changePlace', {
		place: place,
		change: {
			latitude: Number(coordinates.lat.toFixed(7)),
			longitude: Number(coordinates.lng.toFixed(7)),
		},
	});
	updateState(coordinates);
};
const updateState = (payload?: {coords?: Array<number>, zoom?: number}): void => {
	store.dispatch('updateMap', {
		latitude: Number(
			payload && payload.coords
				? payload.coords[0].toFixed(7)
				: map.value.leafletObject.getCenter().lat.toFixed(7)
		),
		longitude: Number(
			payload && payload.coords
				? payload.coords[1].toFixed(7)
				: map.value.leafletObject.getCenter().lng.toFixed(7)
		),
		zoom: Number(
			payload && payload.zoom
				? payload.zoom
				: map.value.leafletObject.getZoom()
		),
	});
};
const ready = (): void => {
	map.value.leafletObject.panTo(mapCenter.value.coords);
};
</script>

<template>
	<div id="mapblock">
		<l-map
			ref="map"
			v-model:zoom="mapCenter.zoom"
			:center="mapCenter.coords as PointExpression"
			@ready="ready()"
			@moveend="updateState()"
			@contextmenu="e => mapContextMenu(e)"
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
				:lat-lng="mapCenter.coords as LatLngExpression"
				draggable
				:visible="mainStore.centerPlacemarkShow"
				@moveend="e => updateState({
					coords: [
						e.target.getLatLng().lat,
						e.target.getLatLng().lng,
					],
				})"
			>
				<l-icon v-bind="icon_center as {}" />
				<l-tooltip>
					{{ mainStore.t.i.maps.center }}
				</l-tooltip>
			</l-marker>
			<l-marker
				v-for="(place, id) in mainStore.places"
				:key="id"
				:lat-lng="[
					mainStore.points[place.pointid]
						? mainStore.points[place.pointid].latitude : 0,
					mainStore.points[place.pointid]
						? mainStore.points[place.pointid].longitude : 0,
				]"
				:draggable="id === mainStore.currentPlace?.id"
				:visible="mainStore.placemarksShow && place.show && !!place.geomark"
				@click="e => placemarkClick(place, e.originalEvent)"
				@contextmenu="e => placemarkClick(place, e)"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@mousemove="() => {if (dragging) placemarkDragStart(place);}"
				@moveend="async (e: Event) => await placemarkDragEnd(place, e)"
			>
				<l-icon
					v-bind="(
						mainStore.mode === 'measure' && mainStore.measure.points.includes(id) && place !== mainStore.currentPlace
							? icon_01_blue
							: (place === mainStore.currentPlace ? icon_01_green : icon_01)
					) as {}"
				/>
				<l-tooltip permanent="true" v-if="place.name">
					{{ place.name }}
				</l-tooltip>
			</l-marker>
			<l-marker
				v-for="(point, id) in mainStore.temps"
				:key="id"
				:lat-lng="[point.latitude, point.longitude]"
				:visible="
					mainStore.placemarksShow &&
					mainStore.tempsPlacemarksShow &&
					point.show
				"
				:draggable="point === mainStore.currentTemp"
				@click="e => placemarkClick(point, e.originalEvent)"
				@contextmenu="e => placemarkClick(point, e)"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@mousemove="() => {if (dragging) placemarkDragStart(point);}"
				@moveend="async (e: Event) => await placemarkDragEnd(point, e)"
			>
				<l-icon
					v-bind="(
						mainStore.mode === 'measure' &&
						mainStore.measure.points.includes(id) &&
						point !== mainStore.currentTemp
							? icon_01_blue_faded
							: (point === mainStore.currentTemp
								? icon_01_green_faded
								: icon_01_faded)
					) as {}"
				/>
				<l-tooltip permanent="true">
					{{ mainStore.t.i.captions.measurePoint }}
					{{ Object.keys(mainStore.temps).indexOf(point.id) + 1 }} —
					{{ coords2string([point.latitude, point.longitude]) }}
				</l-tooltip>
			</l-marker>
			<l-polyline
				v-if="mainStore.mode === 'measure' && mainStore.measure.points.length"
				:lat-lngs="getPointCoordsArray(mainStore.measure.points) as LatLngExpression[]"
				color="rgba(0, 0, 0, 1)"
				:weight="0.5"
			>
			</l-polyline>
			<l-marker
				v-for="(place, id) in mainStore.commonPlaces"
				:key="id"
				:lat-lng="[
					mainStore.points[place.pointid].latitude,
					mainStore.points[place.pointid].longitude,
				]"
				:visible="mainStore.commonPlacemarksShow && !!place.geomark"
				@click="e => placemarkClick(place, e.originalEvent)"
				@contextmenu="e => placemarkClick(place, e.originalEvent)"
			>
				<l-icon
					v-bind="(
						mainStore.mode === 'measure' && mainStore.measure.points.includes(id) && place !== mainStore.currentPlace
							? icon_01_blue
							: (place === mainStore.currentPlace ? icon_01_green : icon_01_grey)
					) as {}"
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
import { LatLngExpression, PointExpression } from "leaflet";
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
import { Place, Point } from '@/stores/types';
import { coords2string, generateRandomString } from '@/shared/common';

const mainStore = useMainStore();

const map = inject('extmap');
const choosePlace = inject('choosePlace') as (...args: any[]) => any;

const icon_01 = ref({
	iconUrl: '/img/markers/marker_01.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_01_faded = ref({
	iconUrl: '/img/markers/marker_01_faded.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_01_grey = ref({
	iconUrl: '/img/markers/marker_01_grey.svg',
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
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_01_blue_faded = ref({
	iconUrl: '/img/markers/marker_01_blue_faded.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_01_green = ref({
	iconUrl: '/img/markers/marker_01_green.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_01_green_faded = ref({
	iconUrl: '/img/markers/marker_01_green_faded.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_01_yellow = ref({
	iconUrl: '/img/markers/marker_01_yellow.svg',
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

const getPointCoordsArray = (pointIdsArray: string[]): number[][] => {
	const coords: number[][] = [];
	let point: Point;
	for (const id of pointIdsArray) {
		if (mainStore.temps[id]) {
			point = mainStore.temps[id];
		} else if (mainStore.places[id]) {
			point = mainStore.points[mainStore.places[id].pointid];
		} else if (mainStore.commonPlaces[id]) {
			point = mainStore.points[mainStore.commonPlaces[id].pointid];
		} else {
			return;
		}
		coords.push([point.latitude, point.longitude]);
	}
	return coords;
}
const mapContextMenu = (e: any): void => {
	mainStore.addTemp({
		id: crypto.randomUUID(),
		userid: sessionStorage.getItem('places-useruuid'),
		latitude: e.latlng.lat,
		longitude: e.latlng.lng,
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
	if (place !== mainStore.currentPlace) {
		mainStore.setMessage(
			mainStore.t.m.popup.needToChoosePlacemark
		);
	}
};
const placemarkDragEnd = async (point: Place | Point, event: any) => {
	const coordinates = event.target.getLatLng();
	await mainStore[point.type === 'point' ? 'changePoint' : 'changePlace']({
		[point.type === 'point' ? 'point' : 'place']: point,
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

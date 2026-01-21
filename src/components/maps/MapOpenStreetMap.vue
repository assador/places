<template>
<div>
	<Teleport to="#container">
		<Popup
			:show="popupProps.show"
			:position="popupProps.position"
			:closeOnClick="false"
			class="points-coordinates messages"
			@update:show="popupProps.show = $event"
			>
			<template #slot>
				<a
					href="javascript:void(0)"
					class="points-coordinates-copy"
					@click="copyCoords(pointInfo.point)"
				>
					{{ mainStore.t.i.text.copy }}
				</a>
				<h3>
					<span class="un_color">
						{{ mainStore.t.i.captions.measurePoint }}:
					</span>
					<span class="color-01">
						{{ pointInfo.point?.name }}
					</span>
				</h3>
				<div class="nobr">
					<span class="un_color">
						{{ mainStore.t.i.captions.latitude }}:
					</span>
					<span class="color-01">
						{{ latitude2string(pointInfo.point?.latitude) }}°
					</span>
				</div>
				<div class="nobr">
					<span class="un_color">
						{{ mainStore.t.i.captions.longitude }}:
					</span>
					<span class="color-01">
						{{ longitude2string(pointInfo.point?.longitude) }}°
					</span>
				</div>
				<div
					v-if="
						pointInfo.point &&
						Object.hasOwn(pointInfo.point, 'altitude') &&
						!isNaN(pointInfo.point.altitude)
					"
					class="nobr"
				>
					<span class="un_color">
						{{ mainStore.t.i.captions.altitude }}:
					</span>
					<span class="color-01">
						{{ pointInfo.point?.altitude }}
						{{ mainStore.t.i.text.m }}
					</span>
				</div>
			</template>
		</Popup>
	</Teleport>
	<div id="mapblock">
		<l-map
			ref="map"
			v-model:zoom="mapCenter.zoom"
			:center="mapCenter.coords as PointExpression"
			@ready="ready()"
			@moveend="updateState()"
			@contextmenu="mapContextMenu"
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
				draggable
				:visible="mainStore.placemarksShow && place.show && !!place.geomark"
				@click="e => placemarkClick(place, e.originalEvent)"
				@contextmenu="e => placemarkClick(place, e)"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
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
				draggable
				@click="e => placemarkClick(point, e.originalEvent)"
				@contextmenu="e => {
					pointInfo.point = point;
					popupProps.show = !popupProps.show;
					popupProps.position.top = e.originalEvent.clientY + 5;
					popupProps.position.right =
						e.originalEvent.view.document.documentElement.clientWidth -
						e.originalEvent.clientX + 5;
				}"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@moveend="async (e: Event) => await placemarkDragEnd(point, e)"
			>
				<l-icon
					v-bind="(
						mainStore.mode === 'measure' &&
						mainStore.measure.points.includes(id) &&
						point !== mainStore.currentPoint
							? icon_01_blue_faded
							: (point === mainStore.currentPoint
								? icon_01_green_faded
								: icon_01_faded)
					) as {}"
				/>
				<l-tooltip permanent="true">
					{{ mainStore.t.i.captions.measurePoint }}
					{{ Object.keys(mainStore.temps).indexOf(point.id) + 1 }} —
					{{ coords2string([point.latitude, point.longitude]) }}
					{{ point.altitude ? ('| ' + point.altitude + ' ' + mainStore.t.i.text.m) : '' }}
				</l-tooltip>
			</l-marker>
			<l-marker
				v-for="(point, idx) in mainStore.trackPoints(mainStore.currentTrack)"
				:key="idx"
				:lat-lng="[point.latitude, point.longitude]"
				:visible="
					mainStore.placemarksShow &&
					mainStore.tempsPlacemarksShow &&
					point.show
				"
				draggable
				@click="e => placemarkClick(point, e.originalEvent)"
				@contextmenu="e => placemarkClick(point, e)"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@moveend="async (e: Event) => await placemarkDragEnd(point, e)"
			>
				<l-icon
					v-bind="(
						point !== mainStore.currentPoint
							? icon_01_blue_faded
							: (point === mainStore.currentPoint
								? icon_01_green_faded
								: icon_01_faded)
					) as {}"
				/>
				<l-tooltip permanent="true">
					{{ mainStore.t.i.captions.measurePoint + ' ' + point.name + ' —' }}
					{{ coords2string([point.latitude, point.longitude]) }}
					{{ point.altitude ? ('| ' + point.altitude + ' ' + mainStore.t.i.text.m) : '' }}
				</l-tooltip>
			</l-marker>
			<l-polyline
				v-if="mainStore.currentTrack && mainStore.currentTrack.points.length"
				:lat-lngs="mainStore.getPointCoordsArray(mainStore.currentTrack.points) as LatLngExpression[]"
				color="rgba(0, 0, 0, 1)"
				:weight="0.5"
			>
			</l-polyline>
			<l-polyline
				v-if="mainStore.mode === 'measure' && mainStore.measure.points.length"
				:lat-lngs="mainStore.getPointCoordsArray(mainStore.measure.points) as LatLngExpression[]"
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
</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
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
import {
	coords2string,
	latitude2string,
	longitude2string,
	point2coords,
	IPlacesPopupProps,
} from '@/shared';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();

const pointInfo = ref({
	point: null,
});
const popupProps = ref<IPlacesPopupProps>({
	show: false,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});

const copyCoords = async (point: Point) => {
    await navigator.clipboard.writeText(
		point2coords(point, mainStore.t.i.text.m, mainStore.t.i.text.h)
	);
};

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

const dragging = ref(false);

const mapContextMenu = async (e: any) => {
	switch (mainStore.mode) {
		case 'normal':
		case 'measure':
			const newTemp = mainStore.addTemp({
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
			if (mainStore.mode === 'measure') {
				mainStore.choosePoint(await newTemp, 'measure');
			}
			break;
		case 'tracks':
			if (!mainStore.currentTrack) break;
			mainStore.addTrackPoint(
				{
					id: crypto.randomUUID(),
					userid: sessionStorage.getItem('places-useruuid'),
					latitude: e.latlng.lat,
					longitude: e.latlng.lng,
					altitude: null,
					common: false,
					type: 'point',
					added: true,
					deleted: false,
					updated: false,
					show: true,
				},
				mainStore.currentTrack,
			);
			break;
	}
}
const placemarkClick = (item: Place | Point, e: Event): void => {
	mainStore.objectClick(item, e.type);
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

<style lang="scss" scoped>
.points-coordinates {
	padding: 30px 20px 10px 20px;
	text-align: right;
	h3 {
		text-align: center;
		margin-bottom: 8px;
	}
	&-degminsecalt, &-copy {
		margin-top: 12px;
	}
	&-copy {
		display: block;
		position: absolute;
		top: -6px; left: 10px;
	}
}
</style>

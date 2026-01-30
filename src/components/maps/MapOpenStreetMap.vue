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
						{{ pointInfo.name }}
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
					v-if="pointInfo.point?.altitude"
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
	<div v-if="showMap" id="mapblock">
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

<!-- SEC Markers: Place Points  -->

			<l-marker
				v-for="(place, id) in mainStore.places"
				:key="id"
				:lat-lng="[
						mainStore.points[place.pointid].latitude,
						mainStore.points[place.pointid].longitude,
				]"
				draggable
				:visible="mainStore.placemarksShow && place.show && !!place.geomark"
				@click="mainStore.setCurrentPlace(place, false)"
				@contextmenu="e => {
					if (
						mainStore.mode === 'measure' &&
						!mainStore.isMeasurePoint(mainStore.points[place.pointid].id)
					) {
						mainStore.addPointToPoints(
							mainStore.points[place.pointid],
							mainStore.measure,
						);
						return;
					}
				pointInfo.point = mainStore.points[place.pointid];
					pointInfo.name = place.name;
					popupProps.show = true;
					popupProps.position.left = 'auto';
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.originalEvent.clientY + 5;
					popupProps.position.right =
						e.originalEvent.view.document.documentElement.clientWidth -
						e.originalEvent.clientX + 5;
				}"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@moveend="e => placemarkDragEnd(place, e)"
			>
				<l-icon
					v-bind="(
						place === mainStore.currentPlace ? icon_01_green : icon_01
					) as {}"
				/>
				<l-tooltip permanent="true" v-if="place.name">
					{{ place.name }}
				</l-tooltip>
			</l-marker>

<!-- SEC Markers: Common Place Points  -->

			<l-marker
				v-for="(place, id) in mainStore.commonPlaces"
				:key="id"
				:lat-lng="[
					mainStore.points[place.pointid].latitude,
					mainStore.points[place.pointid].longitude,
				]"
				:visible="mainStore.commonPlacemarksShow && !!place.geomark"
				@click="mainStore.setCurrentPoint(mainStore.points[place.pointid], false)"
				@contextmenu="e => {
					if (
						mainStore.mode === 'measure' &&
						!mainStore.isMeasurePoint(mainStore.points[place.pointid].id)
					) {
						mainStore.addPointToPoints(
							mainStore.points[place.pointid],
							mainStore.measure,
						);
						return;
					}
				pointInfo.point = mainStore.points[place.pointid];
					pointInfo.name = place.name;
					popupProps.show = true;
					popupProps.position.left = 'auto';
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.originalEvent.clientY + 5;
					popupProps.position.right =
						e.originalEvent.view.document.documentElement.clientWidth -
						e.originalEvent.clientX + 5;
				}"
			>
				<l-icon
					v-bind="(
						mainStore.mode === 'measure' &&
						mainStore.measure.points.find(p => p.id === id) &&
						place === mainStore.currentPlace
							? icon_01_faded : icon_01_green_faded
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

<!-- SEC Markers: Temps  -->

			<template v-for="point in mainStore.temps">
				<l-marker
					v-if="
						mainStore.mode === 'measure' && mainStore.isMeasurePoint(point.id) ||
						!mainStore.isMeasurePoint(point.id)
					"
					:lat-lng="[ point.latitude, point.longitude ]"
					:visible="
						mainStore.placemarksShow &&
						mainStore.tempsPlacemarksShow &&
						point.show
					"
					draggable
					@click="mainStore.setCurrentPoint(point, false)"
					@contextmenu="e => {
						if (
							mainStore.mode === 'measure' &&
							!mainStore.isMeasurePoint(point.id) ||
							mainStore.mode === 'route' &&
							!mainStore.isRoutePoint(point.id, mainStore.currentRoute)
						) {
							mainStore.addPointToPoints(point, mainStore.measure);
							return;
						}
						pointInfo.point = point;
						pointInfo.name = (mainStore.lonelyTemps.indexOf(point) + 1).toString();
						popupProps.show = true;
						popupProps.position.left = 'auto';
						popupProps.position.bottom = 'auto';
						popupProps.position.top = e.originalEvent.clientY + 5;
						popupProps.position.right =
							e.originalEvent.view.document.documentElement.clientWidth -
							e.originalEvent.clientX + 5;
					}"
					@mousedown="() => dragging = true"
					@mouseup="() => dragging = false"
					@move="e => {
						if (mainStore.mode !== 'measure') return;
						const { lat, lng } = e.target.getLatLng();
						point.latitude = lat;
						point.longitude = lng;
					}"
					@moveend="e => placemarkDragEnd(point, e)"
					>
					<l-icon
						v-bind="(point === mainStore.currentPoint
							? icon_01_green
							: (mainStore.isMeasurePoint(point.id)
								? icon_null : icon_01_blue
							)
						) as {}"
					/>
<!-- FIXME When adding a route point to a measure point array, the l-circle is not displayed. -->
					<l-circle-marker
						v-if="
							mainStore.mode === 'measure' &&
							mainStore.isMeasurePoint(point.id)
						"
						:lat-lng="[ point.latitude, point.longitude ]"
						class-name="route-intermediate"
						:radius="10"
						:weight="1"
					/>
				</l-marker>
			</template>

<!-- SEC Markers: Route Points  -->

			<template
				v-if="mainStore.mode === 'routes' && mainStore.routesShow"
				v-for="point in mainStore.routePoints(mainStore.currentRoute)"
				:key="mainStore.currentRoute?.points.length"
			>
				<l-marker
					:lat-lng="[point.latitude, point.longitude]"
					:visible="
						mainStore.placemarksShow &&
						mainStore.tempsPlacemarksShow &&
						point.show
					"
					draggable
					@click="mainStore.setCurrentPoint(point, false)"
					@contextmenu="e => {
						if (
							mainStore.mode === 'routes' &&
							!mainStore.isMeasurePoint(point.id)
						) {
							mainStore.addPointToPoints(point, mainStore.currentRoute);
							return;
						}
						pointInfo.point = point;
						pointInfo.name =
							mainStore.currentRoute.points.find(
								p => p.id === point.id
							).name
						;
						popupProps.show = true;
						popupProps.position.left = 'auto';
						popupProps.position.bottom = 'auto';
						popupProps.position.top = e.originalEvent.clientY + 5;
						popupProps.position.right =
							e.originalEvent.view.document.documentElement.clientWidth -
							e.originalEvent.clientX + 5;
					}"
					@mousedown="() => dragging = true"
					@mouseup="() => dragging = false"
					@moveend="e => placemarkDragEnd(point, e)"
				>
					<l-icon
						v-bind="(point === mainStore.currentPoint
							? icon_01_green : icon_null
						) as {}"
					/>
					<l-circle-marker
						v-if="
							mainStore.currentRoute.points.map(p => p.id).includes(point.id) &&
							point.id !== mainStore.currentRoute.points[0].id &&
							point.id !== mainStore.currentRoute.points[mainStore.currentRoute.points.length - 1].id
						"
						:lat-lng="[point.latitude, point.longitude]"
						class-name="route-intermediate"
						:radius="10"
						:weight="1"
					/>
					<l-tooltip v-if="!popupProps.show" permanent="true">
						{{
							mainStore.currentRoute.points.find(
								p => p.id === point.id
							).description + ' — '
						}}
						{{ coords2string([point.latitude, point.longitude]) }}
						{{ point.altitude ? ('| ' + point.altitude + ' ' + mainStore.t.i.text.m) : '' }}
					</l-tooltip>
				</l-marker>
			</template>

<!-- SEC Circles, Polylines -->

			<l-circle-marker
				v-if="
					mainStore.routesShow &&
					mainStore.mode === 'routes' &&
					polylineCurrentRouteCoords.length
				"
				:lat-lng="polylineCurrentRouteCoords[0]"
				class-name="route-start"
				:radius="13"
				:weight="1"
			/>
			<l-circle-marker
				v-if="
					mainStore.routesShow &&
					mainStore.mode === 'routes' &&
					polylineCurrentRouteCoords.length
				"
				:lat-lng="polylineCurrentRouteCoords[polylineCurrentRouteCoords.length - 1]"
				class-name="route-end"
				:radius="13"
				:weight="1"
			/>
			<l-circle-marker
				v-if="mainStore.mode === 'measure' && polylineCurrentMeasureCoords.length"
				:lat-lng="polylineCurrentMeasureCoords[0]"
				class-name="measure-start"
				:radius="13"
				:weight="1"
			/>
			<l-circle-marker
				v-if="mainStore.mode === 'measure' && polylineCurrentMeasureCoords.length"
				:lat-lng="polylineCurrentMeasureCoords[polylineCurrentMeasureCoords.length - 1]"
				class-name="measure-end"
				:radius="13"
				:weight="1"
			/>
			<l-polyline
				v-if="
					mainStore.routesShow &&
					mainStore.mode === 'routes' &&
					mainStore.currentRoute &&
					mainStore.currentRoute.points.length
				"
				:lat-lngs="
					mainStore.getPointCoordsArray(
						mainStore.currentRoute?.points.map(p => p.id) ?? []
					) as LatLngExpression[]
				"
				color="rgba(0, 0, 0, 1)"
				:weight="0.5"
			/>
			<l-polyline
				v-if="
					mainStore.mode === 'measure' &&
					mainStore.measure.points.length
				"
				:lat-lngs="
					mainStore.getPointCoordsArray(
						mainStore.measure.points.map(p => p.id)
					) as LatLngExpression[]
				"
				color="rgba(0, 0, 0, 1)"
				:weight="0.5"
			/>
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
	LCircleMarker,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { Place, Point, PointName } from '@/stores/types';
import {
	coords2string,
	latitude2string,
	longitude2string,
	point2coords,
	IPlacesPopupProps,
} from '@/shared';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();

const pointInfo = inject<PointName>('pointInfo');
const popupProps = inject<IPlacesPopupProps>('popupProps');

const copyCoords = async (point: Point) => {
    await navigator.clipboard.writeText(
		point2coords(point, mainStore.t.i.text.m, mainStore.t.i.text.h)
	);
};

const map = inject('extmap');
const showMap = inject('showMap');

const mapCenter = computed(() => ({
	coords: [
		mainStore.center.latitude,
		mainStore.center.longitude,
	],
	zoom: mainStore.zoom,
}));

const polylineCurrentRouteCoords = computed(() =>
	mainStore.getPointCoordsArray(
		mainStore.currentRoute?.points.map(p => p.id) ?? []
	) as LatLngExpression[]
);
const polylineCurrentMeasureCoords = computed(() =>
	mainStore.getPointCoordsArray(
		mainStore.measure.points.map(p => p.id)
	) as LatLngExpression[]
);

const dragging = ref(false);

// SEC Right click on an empty space on the map

const mapContextMenu = (e: any) => {
    const { lat, lng } = e.latlng;
    if (mainStore.mode === 'normal' ||  mainStore.mode === 'measure') {
		const temp = mainStore.upsertPoint({
			props: { latitude: lat, longitude: lng },
			where: mainStore.temps,
		});
        if (mainStore.mode === 'measure') {
            mainStore.addPointToPoints(temp, mainStore.measure);
        }
        return;
    }
    if (mainStore.mode === 'routes' && mainStore.currentRoute) {
        mainStore.upsertPoint({
			props: { latitude: lat, longitude: lng },
			where: mainStore.points,
			whom: mainStore.currentRoute,
		});
    }
}
const placemarkDragEnd = async (point: Place | Point, event: any) => {
	const coordinates = event.target.getLatLng();
	mainStore[point.type === 'point' ? 'changePoint' : 'changePlace']({
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
/*
const icon_01_grey = ref({
	iconUrl: '/img/markers/marker_01_grey.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
*/
const icon_01_blue = ref({
	iconUrl: '/img/markers/marker_01_blue.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
/*
const icon_01_blue_faded = ref({
	iconUrl: '/img/markers/marker_01_blue_faded.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
*/
const icon_null = ref({
	iconUrl: '/img/markers/marker_null.svg',
	iconSize: [20, 20],
	iconAnchor: [10, 10],
	popupAnchor: [0, -0],
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

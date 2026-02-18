<template>
<div>
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

<!-- SEC Markers: Place Markers  -->

			<l-marker
				v-for="place in computedPlaces"
				:key="place.key"
				:lat-lng="[
					mainStore.points[place.pointid].latitude,
					mainStore.points[place.pointid].longitude,
				]"
				draggable
				:visible="mainStore.placemarksShow && place.show && place.geomark"
				@click="mainStore.setCurrentPlace(place, false)"
				@contextmenu="e =>
					markerContextMenu(e, mainStore.points[place.pointid], place)
				"
				@mousedown="() => dragging = true"
				@mouseup="() => dragging = false"
				@moveend="e => placemarkDragEnd(place, e)"
			>
				<l-icon
					v-bind="(
						place.added &&
						!place.updated &&
						mainStore.points[place.pointid].added &&
						!mainStore.points[place.pointid].updated
							? icon_new
							: (
								place.id === mainStore.currentPlace.id
									? icon_active
									: icon_basic
							)
					) as {}"
				/>
				<l-tooltip permanent="true" v-if="place.name">
					{{ place.name }}
				</l-tooltip>
			</l-marker>

<!-- SEC Markers: Common Place Markers  -->

			<l-marker
				v-for="place in computedCommonPlaces"
				:key="place.key"
				:lat-lng="[
					mainStore.points[place.pointid].latitude,
					mainStore.points[place.pointid].longitude,
				]"
				:visible="mainStore.commonPlacemarksShow && !!place.geomark"
				@click="mainStore.setCurrentPoint(mainStore.points[place.pointid], false)"
				@contextmenu="e =>
					markerContextMenu(e, mainStore.points[place.pointid], place)
				"
			>
				<l-icon
					v-bind="(
						mainStore.mode === 'measure' &&
						mainStore.measure.points.find(p => p.id === place.id) &&
						place === mainStore.currentPlace
							? icon_common : icon_common_active
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

<!-- SEC Markers: Route Points  -->

			<l-layer-group
				v-if="mainStore.mode === 'routes' && mainStore.routesShow"
			>
				<template
					v-for="route in computedRoutes"
					:key="route.key"
				>
					<l-polyline
						v-if="route.points.length"
						:lat-lngs="
							mainStore.getPointsCoords(
								route.points.map(p => p.id) ?? []
							) as LatLngExpression[]
						"
						color="rgba(0, 0, 0, 1)"
						:weight="route.id === mainStore.currentRoute.id ? 0.6 : 0.3"
					/>
					<l-circle-marker
						v-if="route.points.length"
						:lat-lng="
							mainStore.getPointCoords(
								route.points[0].id
							) as LatLngExpression
						"
						class-name="route-start"
						:radius="route.id === mainStore.currentRoute.id ? 13 : 8"
						:weight="1"
					/>
					<l-circle-marker
						v-if="route.points.length > 1"
						:lat-lng="
							mainStore.getPointCoords(
								route.points.at(-1).id
							) as LatLngExpression
						"
						class-name="route-end"
						:radius="route.id === mainStore.currentRoute.id ? 13 : 8"
						:weight="1"
					/>
					<template
						v-for="point in route.computedRoutePoints"
						:key="point.key"
					>
						<l-marker
							:lat-lng="[point.latitude, point.longitude]"
							:visible="
								mainStore.placemarksShow &&
								mainStore.tempsPlacemarksShow &&
								point.show
							"
							draggable
							@click="mainStore.setCurrentPoint(
								mainStore.getPointById(point.id), false)
							"
							@contextmenu="e =>markerContextMenu(
								e,
								mainStore.getPointById(point.id),
								mainStore.currentRoute
							)"
							@mousedown="() => dragging = true"
							@mouseup="() => dragging = false"
							@move="e => {
								const p = mainStore.getPointById(point.id);
								const { lat, lng } = e.target.getLatLng();
								p.latitude = lat;
								p.longitude = lng;
							}"
							@moveend="e => placemarkDragEnd(
								mainStore.getPointById(point.id), e
							)"
						>
							<l-icon
								v-bind="(
									point.added &&
									!point.updated &&
									point.id === route.points.at(-1).id
										? icon_new
										: (
											point.id === mainStore.currentPoint.id
												? icon_active
												: icon_null
										)
								) as {}"
							/>
							<l-circle-marker
								v-if="
									point.id !== route.points[0].id &&
									point.id !== route.points.at(-1).id
								"
								:lat-lng="[ point.latitude, point.longitude ]"
								class-name="route-intermediate"
								:radius="route.id === mainStore.currentRoute.id ? 10 : 6"
								:weight="1"
							/>
							<l-tooltip v-if="!popupProps.show" permanent="true">
								{{
									route.points.find(
										p => p.id === point.id
									)?.description + ' — '
								}}
								{{ coords2string([point.latitude, point.longitude]) }}
								{{ point.altitude ? ('| ' + point.altitude + ' ' + mainStore.t.i.text.m) : '' }}
							</l-tooltip>
						</l-marker>
					</template>
				</template>
			</l-layer-group>

<!-- SEC Markers: Temps  -->

			<template
				v-for="point in computedTemps"
				:key="point.key"
			>
				<l-marker
					:lat-lng="[ point.latitude, point.longitude ]"
					:visible="
						mainStore.placemarksShow &&
						mainStore.tempsPlacemarksShow &&
						point.show
					"
					:z-index-offset="
						point.id === mainStore.currentPoint?.id ? 10000 : 0
					"
					draggable
					@click="mainStore.setCurrentPoint(
						mainStore.getPointById(point.id), false
					)"
					@contextmenu="e =>
						markerContextMenu(e, mainStore.getPointById(point.id), null
					)"
					@mousedown="() => dragging = true"
					@mouseup="() => dragging = false"
					@move="e => {
						if (mainStore.mode !== 'measure') return;
						const p = mainStore.getPointById(point.id);
						const { lat, lng } = e.target.getLatLng();
						p.latitude = lat;
						p.longitude = lng;
					}"
					@moveend="e =>
						placemarkDragEnd(mainStore.getPointById(point.id), e
					)"
				>
					<l-icon
						v-bind="(point.id === mainStore.currentPoint.id
							? icon_temp_active
							: (mainStore.isMeasurePoint(point.id)
								? icon_null : icon_temp
							)
						) as {}"
					/>
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

<!-- SEC Circles, Polylines -->

			<l-circle-marker
				v-if="
					mainStore.mode === 'measure' &&
					mainStore.measure.points.length
				"
				:lat-lng="
					mainStore.getPointCoords(
						mainStore.measure.points[0].id
					) as LatLngExpression
				"
				class-name="measure-start"
				:radius="13"
				:weight="1"
			/>
			<l-circle-marker
				v-if="
					mainStore.mode === 'measure' &&
					mainStore.measure.points.length
				"
				:lat-lng="
					mainStore.getPointCoords(
						mainStore.measure.points.at(-1).id
					) as LatLngExpression
				"
				class-name="measure-end"
				:radius="13"
				:weight="1"
			/>
			<l-polyline
				v-if="
					mainStore.mode === 'measure' &&
					mainStore.measure.points.length
				"
				:lat-lngs="
					mainStore.getPointsCoords(
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
	LCircleMarker,
	LControlLayers,
	LIcon,
	LLayerGroup,
	LMap,
	LMarker,
	LPolyline,
	LTileLayer,
	LTooltip,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { Place, Route, Point, PointName } from '@/stores/types';
import {
	coords2string,
	IPlacesPopupProps,
} from '@/shared';

const mainStore = useMainStore();

const pointInfo = inject<Ref<PointName>>('pointInfo')!;
const popupProps = inject<Ref<IPlacesPopupProps>>('popupProps')!;

const map = inject('extmap');
const showMap = inject('showMap');

const mapCenter = computed(() => ({
	coords: [
		mainStore.center.latitude,
		mainStore.center.longitude,
	],
	zoom: mainStore.zoom,
}));

const prepareEntities = (entities: any[]) => {
	return entities
		.filter(p => !p.deleted)
		.map(p => ({ ...p, key: p.id }))
	;
};
const computedPlaces =
	computed(() => prepareEntities(Object.values(mainStore.places)))
;
const computedCommonPlaces =
	computed(() => prepareEntities(Object.values(mainStore.commonPlaces)))
;
const computedTemps = computed(() => {
	return Object.values(mainStore.temps)
		.map((pn, index) => ({
			...pn,
			idx: index,
			key: `${pn.id}-${index}`,
		})) || []
});
const computedRoutes = computed(() => {
	return Object.values(mainStore.routes)
		.filter(r => !r.deleted && r.geomarks === 1)
		.map((r, index) => ({
			...r,
			idx: index,
			key: `${r.id}-${index}`,
			computedRoutePoints:
				mainStore.routePoints(r)
					.filter(p => !p.deleted)
					.map((p, pindex) => ({
						...p,
						idx: pindex,
						key: `${p.id}-${pindex}`,
					}))
			,
		}))
	;
});

const dragging = ref(false);

// SEC Right clicks

const mapContextMenu = (e: any) => {
    const { lat, lng } = e.latlng;
    if (mainStore.mode === 'normal' ||  mainStore.mode === 'measure') {
		const temp = mainStore.upsertPoint({
			props: { latitude: lat, longitude: lng },
			where: mainStore.temps,
		});
        if (mainStore.mode === 'measure') {
            mainStore.addPointToPoints({
				point: temp,
				entity: mainStore.measure,
			});
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
const markerContextMenu = (e: any, point: Point, of: Place | Route | null) => {
	switch (mainStore.mode) {
		case 'routes':
			if (
				point.id !== mainStore.currentRoute.points.at(-1)?.id &&
				!(
					point.id === mainStore.currentPoint?.id &&
					mainStore.isRoutePoint(point.id, mainStore.currentRoute)
				)
			) {
				mainStore.addPointToPoints({
					point: point,
					entity: mainStore.currentRoute,
				});
				return;
			}
			break;
		case 'measure':
			if (
				point.id !== mainStore.measure.points.at(-1)?.id &&
				!(
					point.id === mainStore.currentPoint?.id &&
					mainStore.isMeasurePoint(point.id)
				)
			) {
				mainStore.addPointToPoints({
					point: point,
					entity: mainStore.measure,
				});
				return;
			}
			break;
		default:
			break;
	}
	switch (of?.type) {
		case 'route':
			pointInfo.value.name =
				mainStore.currentRoute.points.find(
					p => p.id === point.id
				).name
			;
			break;
		case 'place':
			pointInfo.value.name =
				Object.values(mainStore.places).find(
					p => p.pointid === point.id
				)?.name
			;
			break;
	}
	pointInfo.value.point = point;
	popupProps.value.show = !popupProps.value.show;
	popupProps.value.position.left = 'auto';
	popupProps.value.position.bottom = 'auto';
	popupProps.value.position.top = e.originalEvent.clientY + 5;
	popupProps.value.position.right =
		e.originalEvent.view.document.documentElement.clientWidth -
		e.originalEvent.clientX + 5;
}

// SEC Other

const placemarkDragEnd = async (point: Place | Point, event: any) => {
	const coordinates = event.target.getLatLng();
	mainStore.changePoint({
		entity: (
			point.type === 'point'
				? point
				: mainStore.points[(point as Place).pointid]
		),
		change: {
			latitude: Number(coordinates.lat.toFixed(7)),
			longitude: Number(coordinates.lng.toFixed(7)),
		},
	});
};
const updateState = (payload?: { coords?: Array<number>, zoom?: number }) => {
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

const icon_null = ref({
	iconUrl: '/img/markers/marker_null.svg',
	iconSize: [20, 20],
	iconAnchor: [10, 10],
	popupAnchor: [0, -0],
});
const icon_center = ref({
	iconUrl: '/img/markers/marker_center.svg',
	iconSize: [50, 50],
	iconAnchor: [25, 25],
	popupAnchor: [25, -25],
});
const icon_new = ref({
	iconUrl: '/img/markers/marker_01_pink.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_active = ref({
	iconUrl: '/img/markers/marker_01_green.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_basic = ref({
	iconUrl: '/img/markers/marker_01.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_temp = ref({
	iconUrl: '/img/markers/marker_01_blue_faded.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_temp_active = ref({
	iconUrl: '/img/markers/marker_01_blue.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_common = ref({
	iconUrl: '/img/markers/marker_01_grey.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
const icon_common_active = ref({
	iconUrl: '/img/markers/marker_01_green_faded.svg',
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
/*
const icon_temp_faded = ref({
	iconUrl: '/img/markers/marker_01_blue_faded.svg',
	iconSize: [25, 38],
	iconAnchor: [13, 38],
	popupAnchor: [0, -34],
	shadowUrl: '/img/markers/marker_01_shadow.svg',
	shadowSize: [25, 38],
	shadowAnchor: [2, 24],
});
*/
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
.asdfasdf {
	opacity: 0.5;
}
</style>

<template>
	<div id="mapblock">
		<yandex-map
			v-model="map"
			@contextmenu="(e: PointerEvent) => yandexMapContextMenuNative(e)"
			:settings="{
				location: {
					center: [
						mainStore.center.longitude,
						mainStore.center.latitude,
					],
					zoom: mainStore.zoom,
				},
			}"
		>
			<yandex-map-listener
				:settings="{
					onActionEnd: () => updateState(),
					onContextMenu: (_, e) => yandexMapContextMenu(e),
				}"
			/>

<!-- SEC Markers: Center Marker  -->

			<yandex-map-marker
				v-model="markerCenter"
				:settings="{
					...mapCenter,
					draggable: true,
					onDragEnd: e => updateState({ coords: e.toReversed() }),
				}"
				:visible="mainStore.centerMarkerShow"
			>
				<img
					class="marker-center"
					:src="markersOptions.icon_center.iconUrl"
				/>
			</yandex-map-marker>

<!-- SEC Markers: Place Markers  -->

			<template v-if="
				mainStore.placesShow.show &&
				mainStore.markersShow
			">
				<yandex-map-marker
					v-for="place in computedPlaces"
					:key="place.key"
					v-model="placeMarkers[place.id]"
					:settings="{
						coordinates: [
							mainStore.points[place.pointid].longitude,
							mainStore.points[place.pointid].latitude,
						],
						draggable: true,
						onDragStart: () => { dragging = true },
						onDragEnd: coords => {
							dragging = false;
							markerDragEnd(place.pointid, coords);
						},
						onDragMove: e => moveMarker(e, place.pointid),
					}"
					:visible="place.show && place.geomark"
					class="place"
					@click.stop.prevent="mainStore.setCurrentPlace(place, false)"
					@contextmenu.stop.prevent="(e: PointerEvent) => {
						if (mainStore.mode !== 'normal' && e.shiftKey) {
							markerAddPoint(mainStore.points[place.pointid]);
						} else {
							markerContextMenu(e, mainStore.points[place.pointid]);
						}
					}"
					@dblclick.stop.prevent="() => {
						if (mainStore.mode !== 'normal' && common.compact === 2) {
							markerAddPoint(mainStore.points[place.pointid]);
						}
					}"
				>
					<img
						class="marker"
						:src="markersOptions[
							place.added &&
							!place.updated &&
							mainStore.points[place.pointid].added &&
							!mainStore.points[place.pointid].updated
								? 'icon_new'
								: (
									place.id === mainStore.currentPlaceId
										? 'icon_active'
										: 'icon_basic'
								)
						].iconUrl"
					/>
				</yandex-map-marker>

<!-- SEC Markers: Common Place Markers  -->

				<yandex-map-marker
					v-for="place in computedCommonPlaces"
					:key="place.key"
					v-model="placeMarkers[place.id]"
					:settings="{
						coordinates: [
							mainStore.points[place.pointid].longitude,
							mainStore.points[place.pointid].latitude,
						],
						draggable: false,
					}"
					:visible="mainStore.commonMarkersShow && place.geomark"
					@click.stop.prevent="mainStore.setCurrentPoint(mainStore.points[place.pointid], false)"
					@contextmenu.stop.prevent="(e: PointerEvent) => {
						if (mainStore.mode !== 'normal' && e.shiftKey) {
							markerAddPoint(mainStore.points[place.pointid]);
						} else {
							markerContextMenu(e, mainStore.points[place.pointid]);
						}
					}"
					@dblclick.stop.prevent="() => {
						if (mainStore.mode !== 'normal' && common.compact === 2) {
							markerAddPoint(mainStore.points[place.pointid]);
						}
					}"
				>
					<img
						class="marker"
						:src="markersOptions[
							mainStore.mode === 'measure' &&
							mainStore.measure.points.find(p => p.id === place.id) &&
							place.id === mainStore.currentPlaceId
								? 'icon_common' : 'icon_common_active'
						].iconUrl"
					/>
				</yandex-map-marker>
			</template>

<!-- SEC Markers: Route Points  -->

			<template v-if="
				mainStore.mode === 'routes' &&
				mainStore.routesShow.show &&
				mainStore.markersShow
			">
				<template
					v-for="route in computedRoutes"
					:key="route.id"
				>
					<yandex-map-feature
						v-model="routeFeauterRefs[route.id]"
						:settings="{
							geometry: {
								type: 'LineString',
								coordinates: mainStore.getPointsCoords(
									route.points.map(p => p.id) ?? []
								).map(coords => coords.toReversed()) as unknown as LngLat[],
							},
							style: {
								stroke: [{
									color: '#000000',
									width: route.id === mainStore.currentRouteId ? 0.6 : 0.3,
								}],
							}
						}"
					/>
					<yandex-map-feature
						v-model="routeFeauterForEventRefs[route.id]"
						:settings="{
							geometry: {
								type: 'LineString',
								coordinates: mainStore.getPointsCoords(
									route.points.map(p => p.id) ?? []
								).map(coords => coords.toReversed()) as unknown as LngLat[],
							},
							style: {
								stroke: [{
									color: '#00000000',
									width: 20,
								}],
								cursor: 'pointer',
							},
							onDoubleClick: (_, e) => {
								e.stopPropagation();
								addPointToRoute(route, e.coordinates);
							},
						}"
					/>
					<template
						v-for="(point, index) in route.computedRoutePoints"
						:key="point.idx"
					>
						<yandex-map-marker
							v-model="routePointMarkers[point.id]"
							:settings="{
								coordinates: [
									point.longitude,
									point.latitude,
								],
								draggable: true,
								onDragStart: () => { dragging = true },
								onDragEnd: coords => {
									dragging = false;
									markerDragEnd(point.id, coords);
								},
								onDragMove: e => moveMarker(e, point.id, route.id, index),
							}"
							:visible="
								mainStore.tempsShow.show &&
								point.show
							"
							@click.stop.prevent="mainStore.setCurrentPoint(mainStore.getPointById(point.id), false)"
							@contextmenu.stop.prevent="(e: PointerEvent) => {
								if (mainStore.mode !== 'normal' && e.shiftKey) {
									markerAddPoint(mainStore.getPointById(point.id));
								} else {
									markerContextMenu(e, mainStore.getPointById(point.id));
								}
							}"
							@dblclick.stop.prevent="() => {
								if (mainStore.mode !== 'normal' && common.compact === 2) {
									markerAddPoint(mainStore.getPointById(point.id));
								}
							}"
						>
							<div
								v-if="point.id === route.points[0].id"
								class="marker-start"
								:class="{
									'marker-current': route.id === mainStore.currentRouteId
								}"
							/>
							<div
								v-else-if="point.id === route.points.at(-1).id"
								class="marker-end"
								:class="{
									'marker-current': route.id === mainStore.currentRouteId
								}"
							/>
							<div
								v-else
								class="marker-intermediate"
								:class="{
									'marker-current': route.id === mainStore.currentRouteId
								}"
							/>
							<img
								v-if="point.id === mainStore.currentPointId"
								:src="markersOptions.icon_active.iconUrl"
								class="marker"
							/>
						</yandex-map-marker>
					</template>
				</template>
			</template>

<!-- SEC Markers: Measure  -->

			<template v-if="
				mainStore.markersShow &&
				mainStore.mode === 'measure' &&
				mainStore.measure.points.length
			">
				<yandex-map-feature
					v-if="mainStore.measure.points.length > 1"
					v-model="routeFeauterRefs['measureId']"
					:settings="{
						geometry: {
							type: 'LineString',
							coordinates: mainStore.getPointsCoords(
								mainStore.measure.points.map(p => p.id) ?? []
							).map(coords => coords.toReversed()) as unknown as LngLat[],
						},
						style: {
							stroke: [{
								color: '#000000',
								width: 0.6,
							}],
						}
					}"
				/>
				<yandex-map-feature
					v-if="mainStore.measure.points.length > 1"
					v-model="routeFeauterForEventRefs['measureId']"
					:settings="{
						geometry: {
							type: 'LineString',
							coordinates: mainStore.getPointsCoords(
								mainStore.measure.points.map(p => p.id) ?? []
							).map(coords => coords.toReversed()) as unknown as LngLat[],
						},
						style: {
							stroke: [{
								color: '#00000000',
								width: 20
								,
							}],
							cursor: 'pointer',
						},
						onDoubleClick: (_, e) => {
							e.stopPropagation();
							addPointToRoute(mainStore.measure, e.coordinates);
						},
					}"
				/>
				<template
					v-for="fat in mainStore.measureFatPoints"
					:key="fat.key"
				>
					<yandex-map-marker
						v-model="measurePointMarkers[fat.point.id]"
						:settings="{
							coordinates: [
								fat.point.longitude,
								fat.point.latitude,
							],
							draggable: true,
							onDragStart: () => { dragging = true },
							onDragEnd: coords => {
								dragging = false;
								markerDragEnd(fat.point.id, coords);
							},
							onDragMove: e => moveMarker(e, fat.point.id, 'measureId', fat.index),
						}"
						:visible="fat.point.show"
						@click.stop.prevent="mainStore.setCurrentPoint(fat.point, false)"
						@contextmenu.stop.prevent="(e: PointerEvent) => {
							if (mainStore.mode !== 'normal' && e.shiftKey) {
								markerAddPoint(fat.point);
							} else {
								markerContextMenu(e, fat.point);
							}
						}"
						@dblclick.stop.prevent="() => {
							if (mainStore.mode !== 'normal' && common.compact === 2) {
								markerAddPoint(fat.point);
							}
						}"
					>
						<div
							v-if="fat.point.id === mainStore.measure.points[0]?.id"
							class="marker-current marker-start"
						/>
						<div
							v-else-if="fat.point.id === mainStore.measure.points.at(-1)?.id"
							class="marker-current marker-end"
						/>
						<div
							v-else
							class="marker-current marker-intermediate"
						/>
						<img
							v-if="
								fat.point.id === mainStore.currentPointId &&
								!mainStore.isPlacePoint(fat.point.id)
							"
							:src="markersOptions.icon_temp_active.iconUrl"
							class="marker"
						/>
					</yandex-map-marker>
				</template>
			</template>

<!-- SEC Markers: Temps  -->

			<template v-if="
				mainStore.markersShow &&
				mainStore.tempsShow.show
			">
				<template
					v-for="fat in mainStore.notMeasureFatTemps.points"
					:key="fat.key"
				>
					<yandex-map-marker
						v-model="tempPointMarkers[fat.point.id]"
						:settings="{
							coordinates: [
								fat.point.longitude,
								fat.point.latitude,
							],
							draggable: true,
							onDragStart: () => { dragging = true },
							onDragEnd: coords => {
								dragging = false;
								markerDragEnd(fat.point.id, coords);
							},
						}"
						:visible="fat.point.show"
						@click.stop.prevent="mainStore.setCurrentPoint(fat.point, false)"
						@contextmenu.stop.prevent="(e: PointerEvent) => {
							if (mainStore.mode !== 'normal' && e.shiftKey) {
								markerAddPoint(fat.point);
							} else {
								markerContextMenu(e, fat.point);
							}
						}"
						@dblclick.stop.prevent="() => {
							if (mainStore.mode !== 'normal' && common.compact === 2) {
								markerAddPoint(fat.point);
							}
						}"
					>
						<img
							:src="markersOptions[
								fat.point.id === mainStore.currentPointId
									? 'icon_temp_active' : 'icon_temp'
							].iconUrl"
							class="marker"
						/>
					</yandex-map-marker>
				</template>
			</template>

			<yandex-map-default-features-layer />
			<yandex-map-default-scheme-layer />
			<yandex-map-controls :settings="{ position: 'top left' }">
				<yandex-map-geolocation-control />
				<yandex-map-zoom-control />
				<yandex-map-scale-control />
			</yandex-map-controls>
			<yandex-map-controls :settings="{
				position: 'bottom left',
				orientation: 'vertical',
			}">
				<yandex-map-open-maps-button />
			</yandex-map-controls>
		</yandex-map>
	</div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue';
import { useMainStore } from '@/stores/main';
import { Point, Route, Measure } from '@/types';
import { common } from '@/services/common';
import { getPointToSegmentDistance, calculatePopupPosition } from '@/shared/common';
import { mapContextMenu } from '@/shared/map';
import {
	YandexMap,
	YandexMapListener,
	YandexMapMarker,
	YandexMapFeature,
	YandexMapDefaultSchemeLayer,
	YandexMapDefaultFeaturesLayer,
	createYmapsOptions,
	YandexMapControls,
	YandexMapGeolocationControl,
	YandexMapOpenMapsButton,
	YandexMapScaleControl,
	YandexMapZoomControl,
} from 'vue-yandex-maps';
import type {
	YMap,
	YMapMarker,
	YMapFeature,
	LngLat,
	DomEvent,
} from '@yandex/ymaps3-types';

const mainStore = useMainStore();

const map = shallowRef<YMap | null>(null);
const placeMarkers = shallowRef<Record<string, YMapMarker | null>>({});
const routePointMarkers = shallowRef<Record<string, YMapMarker | null>>({});
const measurePointMarkers = shallowRef<Record<string, YMapMarker | null>>({});
const tempPointMarkers = shallowRef<Record<string, YMapMarker | null>>({});
const markerCenter = shallowRef<YMapMarker | null>(null);
const routeFeauterRefs = ref<Record<string, YMapFeature | null>>({});
const routeFeauterForEventRefs = ref<Record<string, YMapFeature | null>>({});

const routeLineRefs = computed(() => {
	const refs: Record<string, { element: YMapFeature | null, pointIds: string[] }> = {};
	for (const id in routeFeauterRefs.value) {
		refs[id] = {
			element: routeFeauterRefs.value[id],
			pointIds: id === 'measureId'
				? mainStore.measure.points.map(p => p.id)
				: mainStore.routes[id].points.map(p => p.id)
			,
		}
	}
	return refs;
});

createYmapsOptions({ apikey: 'f81dd454-9378-4883-86ae-c84eb24d72d6' });

const mapCenter = computed(() => ({
	coordinates: [
		mainStore.center.longitude,
		mainStore.center.latitude,
	] as LngLat,
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
const computedRoutes = computed(() => {
	return Object.values(mainStore.routes)
		.filter(r => !r.deleted && r.geomarks === 1)
		.map(r => ({
			...r,
			computedRoutePoints:
				mainStore.routePoints(r)
					.filter(p => !p.deleted)
					.map((p, pindex) => ({
						...p,
						idx: pindex,
					}))
			,
		}))
	;
});

const dragging = ref(false);

const pointToLinesMap = computed(() => {
	const mapping: Record<string, { lineId: string; index: number }[]> = {};
	for (const [lineId, refData] of Object.entries(routeLineRefs.value)) {
		refData.pointIds.forEach((pId, idx) => {
			if (!mapping[pId]) mapping[pId] = [];
			mapping[pId].push({ lineId, index: idx });
		});
	}
	return mapping;
});
const moveMarker = (e: any, pointId: string, lineId?: string, pointIndex?: number) => {
	const updatePolyline = (lId: string, pIdx: number) => {
		const polyline = routeFeauterRefs.value[lId];
		if (polyline && polyline.geometry) {
			const coords = [ ...polyline.geometry.coordinates ];
				coords[pIdx] = [ e[0], e[1] ];
				polyline.update({
					geometry: {
						type: 'LineString',
						coordinates: coords as LngLat[],
					},
				});
		}
	};
	if (lineId !== undefined && pointIndex !== undefined) {
		updatePolyline(lineId, pointIndex);
		placeMarkers.value[pointId]?.update({ coordinates: [ e[0], e[1] ] })
	} else {
		const targets = pointToLinesMap.value[pointId];
		if (targets) {
			targets.forEach(target => updatePolyline(target.lineId, target.index));
		}
		routePointMarkers.value[pointId]?.update({ coordinates: [ e[0], e[1] ] })
		measurePointMarkers.value[pointId]?.update({ coordinates: [ e[0], e[1] ] })
		tempPointMarkers.value[pointId]?.update({ coordinates: [ e[0], e[1] ] })
	}
};

// SEC Right clicks

const yandexMapContextMenuEvent = ref(null);
const yandexMapContextMenuNative = (e: PointerEvent) => {
	yandexMapContextMenuEvent.value = e;
}
const yandexMapContextMenu = (e: DomEvent) => {
	mapContextMenu(
		yandexMapContextMenuEvent.value, // Greetings to the part-time perverts at Yandex.
		e.coordinates[1],
		e.coordinates[0],
	);
}
const markerContextMenu = (
	e: PointerEvent,
	point: Point,
) => {
	e.stopPropagation();
	e.preventDefault();
	if (common.popupProps.show && common.pointInfo?.point.id === point.id) {
		common.hidePopup();
		common.clearPointInfo();
	} else {
		common.setPointInfo({ id: point.id });
		common.showPopup(calculatePopupPosition(e));
	}
};
const markerAddPoint = (point: Point) => {
	switch (mainStore.mode) {
		case 'routes':
			if (
				point.id !== mainStore.currentRoute?.points.at(-1)?.id &&
				!(
					point.id === mainStore.currentPointId &&
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
					point.id === mainStore.currentPointId &&
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
}

// SEC Other

const markerDragEnd = async (pointId: string, coords: LngLat) => {
	mainStore.changePoint({
		entity: mainStore.getPointById(pointId),
		change: {
			latitude: Number(coords[1].toFixed(7)),
			longitude: Number(coords[0].toFixed(7)),
		},
	});
};
const addPointToRoute = (route: Route | Measure, coordinates: any) => {
	const routePointCoordinates =
		mainStore.getPointsCoords(route.points.map(p => p.id) ?? [])
			.map(coords => coords.toReversed())
	;
	let minDistance = Infinity;
	let segmentIndex = -1;
	for (let i = 0; i < routePointCoordinates.length - 1; i++) {
		const p1 = routePointCoordinates[i];
		const p2 = routePointCoordinates[i + 1];
		const dist = getPointToSegmentDistance(
			coordinates,
			[p1[0], p1[1]],
			[p2[0], p2[1]],
		);
		if (dist < minDistance) {
			minDistance = dist;
			segmentIndex = i;
		}
	}
	const point = mainStore.upsertPoint({
		props: { latitude: coordinates[1], longitude: coordinates[0] },
		where: route.type === 'measure' ? mainStore.temps : mainStore.points,
	});
	mainStore.addPointToPoints({
		point: point,
		entity: route,
		index: segmentIndex + 1,
	});
};
const updateState = (payload?: { coords?: number[], zoom?: number }) => {
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

const markersOptions = ref({
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
	icon_null: {
		iconUrl: '/img/markers/marker_null.svg',
	},
	icon_center: {
		iconUrl: '/img/markers/marker_center.svg',
	},
	icon_new: {
		iconUrl: '/img/markers/marker_01_pink.svg',
	},
	icon_active: {
		iconUrl: '/img/markers/marker_01_green.svg',
	},
	icon_basic: {
		iconUrl: '/img/markers/marker_01.svg',
	},
	icon_temp: {
		iconUrl: '/img/markers/marker_01_blue_faded.svg',
	},
	icon_temp_active: {
		iconUrl: '/img/markers/marker_01_blue.svg',
	},
	icon_common: {
		iconUrl: '/img/markers/marker_01_grey.svg',
	},
	icon_common_active: {
		iconUrl: '/img/markers/marker_01_green_faded.svg',
	},
});
</script>

<style lang="scss" scoped>
* {
	user-select: none;
}
.marker,
.marker-center,
.marker-start,
.marker-end,
.marker-intermediate {
	position: absolute;
	cursor: pointer;
	max-width: unset;
	z-index: 10;
}
.marker,
.marker-center,
.marker-start,
.marker-end,
.marker-intermediate {
	position: absolute;
	cursor: pointer;
	max-width: unset;
	z-index: 10;
}
.marker {
	width: 25px; height: 38px;
	transform: translate(-50%, -100%);
	z-index: 20;
}
.marker-center {
	width: 50px; height: 50px;
	transform: translate(-50%, -50%);
	z-index: 30;
}
.marker-caption {
	position: absolute;
	top: -15px; left: -7px;
}
.marker-start {
	transform: translate(-50%, -50%);
	background-color: rgba(0, 165, 242, 0.7);
	border: 2px solid rgba(255, 255, 255, 0.8);
	border-radius: 50%;
}
.marker-end {
	transform: translate(-50%, -50%);
	background-color: rgba(242, 156, 0, 0.7);
	border: 2px solid rgba(255, 255, 255, 0.8);
	border-radius: 50%;
}
.marker-intermediate {
	transform: translate(-50%, -50%);
	background-color: rgba(0, 0, 0, 0.2);
	border: 2px solid rgba(255, 255, 255, 0.8);
	border-radius: 50%;
}
.marker-start, .marker-end {
	width: 18px; height: 18px;
}
.marker-intermediate {
	width: 14px; height: 14px;
}
.marker-start.marker-current, .marker-end.marker-current {
	width: 30px; height: 30px;
}
.marker-intermediate.marker-current {
	width: 22px; height: 22px;
}
</style>

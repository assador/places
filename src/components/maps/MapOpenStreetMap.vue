<template>
	<div id="mapblock">
		<l-map
			ref="map"
			v-model:zoom="mapCenter.zoom"
			:center="mapCenter.coords as PointExpression"
			@ready="ready"
			@dragend="updateState"
			@contextmenu="leafletMapContextMenu"
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

<!-- SEC Markers: Center Marker  -->

			<l-marker
				:lat-lng="mapCenter.coords as LatLngExpression"
				draggable
				:visible="mainStore.centerMarkerShow"
				@dragend="(e: any) => updateState({
					coords: [
						e.target.getLatLng().lat,
						e.target.getLatLng().lng,
					],
				})"
			>
				<l-icon v-bind="icon_center as {}" />
			</l-marker>

<!-- SEC Markers: Place Markers  -->

			<l-layer-group v-if="
				mainStore.placesShow.show &&
				mainStore.markersShow
			">
				<l-marker
					v-for="place in computedPlaces"
					:key="place.id"
					:lat-lng="[
						mainStore.points[place.pointid].latitude,
						mainStore.points[place.pointid].longitude,
					]"
					draggable
					:visible="place.show && !!place.geomark"
					@click="mainStore.setCurrentPlace(place, false)"
					@contextmenu="(e: any) => {
						if (mainStore.mode !== 'normal' && e.originalEvent.shiftKey) {
							markerAddPoint(mainStore.points[place.pointid]);
						} else {
							markerContextMenu(e, mainStore.points[place.pointid], place);
						}
					}"
					@dblclick="() => {
						if (mainStore.mode !== 'normal' && common.compact === 2) {
							markerAddPoint(mainStore.points[place.pointid]);
						}
					}"
					@dragstart="dragging = true"
					@dragend="(e: any) => {
						dragging = false;
						markerDragEnd(place.pointid, e);
					}"
					@move="(e: any) => moveMarker(e, place.pointid)"
				>
					<l-icon
						v-bind="(
							place.added &&
							!place.updated &&
							mainStore.points[place.pointid].added &&
							!mainStore.points[place.pointid].updated
								? icon_new
								: (
									place.id === mainStore.currentPlaceId
										? icon_active
										: icon_basic
								)
						) as {}"
					/>
				</l-marker>

<!-- SEC Markers: Common Place Markers  -->

				<l-layer-group v-if="mainStore.commonMarkersShow">
					<l-marker
						v-for="place in computedCommonPlaces"
						:key="place.id"
						:lat-lng="[
							mainStore.points[place.pointid].latitude,
							mainStore.points[place.pointid].longitude,
						]"
						:visible="!!place.geomark"
						@click="mainStore.setCurrentPoint(mainStore.points[place.pointid], false)"
						@contextmenu="(e: any) => {
							if (mainStore.mode !== 'normal' && e.originalEvent.shiftKey) {
								markerAddPoint(mainStore.points[place.pointid]);
							} else {
								markerContextMenu(e, mainStore.points[place.pointid], place);
							}
						}"
						@dblclick="() => {
							if (mainStore.mode !== 'normal' && common.compact === 2) {
								markerAddPoint(mainStore.points[place.pointid]);
							}
						}"
					>
						<l-icon
							v-bind="(
								mainStore.mode === 'measure' &&
								mainStore.measure.points.find(p => p.id === place.id) &&
								place.id === mainStore.currentPlaceId
									? icon_common : icon_common_active
							) as {}"
						/>
					</l-marker>
				</l-layer-group>
			</l-layer-group>

<!-- SEC Markers: Route Points  -->

			<l-layer-group v-if="
				mainStore.routesShow.show &&
				mainStore.markersShow
			">
				<template
					v-for="route in computedRoutes"
					:key="route.id"
				>
					<l-polyline
						v-if="route.points.length"
						:ref="el => setRef(route.id, el, routeLineRefs)"
						:lat-lngs="
							mainStore.getPointsCoords(
								route.points.map(p => p.id) ?? []
							) as LatLngExpression[]
						"
						:color="`rgba(0, 0, 0, ${route.id === mainStore.currentRouteId ? 0.5 : 0.2})`"
						:weight="2"
					/>
					<l-polyline
						v-if="route.points.length"
						:ref="el => setRef(route.id, el, routeLineForEventRefs)"
						:lat-lngs="
							mainStore.getPointsCoords(
								route.points.map(p => p.id) ?? []
							) as LatLngExpression[]
						"
						color="rgba(0, 0, 0, 0)"
						:weight="20"
					/>
					<l-circle-marker
						v-if="route.points.length"
						:ref="el => setRef('circle-' + route.points[0].id, el, markerRefs)"
						:lat-lng="
							mainStore.getPointCoords(
								route.points[0].id
							) as LatLngExpression
						"
						class-name="marker-start"
						:radius="route.id === mainStore.currentRouteId ? 13 : 8"
						:weight="1"
					/>
					<l-circle-marker
						v-if="route.points.length > 1"
						:ref="el => {
							const point = route.points.at(-1);
							if (isPointDescription(point)) setRef('circle-' + point.id, el, markerRefs);
						}"
						:lat-lng="pointCoordsByIndex(route.points, -1) ?? [0, 0]"
						class-name="marker-end"
						:radius="route.id === mainStore.currentRouteId ? 13 : 8"
						:weight="1"
					/>
					<template
						v-for="(point, index) in computedRoutePointsArray(route.points)"
						:key="`${route.id}-${point.id}-${index}`"
					>
						<l-marker
							:lat-lng="[ point.latitude, point.longitude ]"
							:visible="
								mainStore.tempsShow.show &&
								point.show
							"
							draggable
							@click="() => {
								mainStore.setCurrentRoute(route.id, false);
								mainStore.setCurrentPoint(mainStore.getPointById(point.id), false);
							}"
							@contextmenu="(e: any) => {
								if (mainStore.mode !== 'normal' && e.originalEvent.shiftKey) {
									markerAddPoint(point);
								} else {
									markerContextMenu(e, point, route);
								}
							}"
							@dblclick="() => {
								if (mainStore.mode !== 'normal' && common.compact === 2) {
									markerAddPoint(point);
								}
							}"
							@dragstart="dragging = true"
							@dragend="(e: any) => {
								dragging = false;
								markerDragEnd(point.id, e);
							}"
							@move="(e: any) => moveMarker(e, point.id, route.id, index)"
						>
							<l-icon
								v-bind="(point.id === mainStore.currentPointId
									? icon_active : icon_null
								) as {}"
							/>
							<l-circle-marker
								v-if="
									point.id !== route.points[0].id &&
									point.id !== route.points.at(-1)?.id
								"
								:ref="el => setRef('circle-' + point.id, el, markerRefs)"
								:lat-lng="[ point.latitude, point.longitude ]"
								class-name="marker-intermediate"
								:radius="10"
								:weight="1"
							/>
						</l-marker>
					</template>
				</template>
			</l-layer-group>

<!-- SEC Markers: Measure  -->

			<l-layer-group v-if="
				mainStore.markersShow &&
				mainStore.mode === 'measure' &&
				mainStore.measure.points.length
			">
				<template
					v-for="fat in mainStore.measureFatPoints"
					:key="fat.key"
				>
					<l-marker
						:ref="el => setRef(fat.point.id, el, markerRefs)"
						:lat-lng="[ fat.point.latitude, fat.point.longitude ]"
						:visible="fat.point.show"
						:z-index-offset="fat.point.id === mainStore.currentPointId ? 10000 : 0"
						draggable
						@click="mainStore.setCurrentPoint(fat.point, false)"
						@contextmenu="(e: any) => {
							if (mainStore.mode !== 'normal' && e.originalEvent.shiftKey) {
								markerAddPoint(fat.point);
							} else {
								markerContextMenu(e, fat.point, mainStore.measure);
							}
						}"
						@dblclick="() => {
							if (mainStore.mode !== 'normal' && common.compact === 2) {
								markerAddPoint(fat.point);
							}
						}"
						@dragstart="dragging = true"
						@dragend="(e: any) => {
							dragging = false;
							const { lat, lng } = e.target.getLatLng();
							if (markerRefs['circle-' + fat.point.id]) {
								markerRefs['circle-' + fat.point.id].setLatLng([ lat, lng ]);
							}
							markerDragEnd(fat.point.id, e);
						}"
						@move="(e: any) => moveMarker(e, fat.point.id, 'measureId', fat.index)"
					>
						<l-icon
							v-bind="(fat.point.id === mainStore.currentPointId
								? icon_temp_active
								: icon_null
							) as {}"
						/>
						<l-circle-marker
							v-if="
								fat.point.id !== mainStore.measure.points[0].id &&
								fat.point.id !== mainStore.measure.points.at(-1)?.id
							"
							:ref="el => setRef('circle-' + fat.point.id, el, markerRefs)"
							:lat-lng="[ fat.point.latitude, fat.point.longitude ]"
							class-name="marker-intermediate"
							:radius="10"
							:weight="1"
						/>
					</l-marker>
				</template>
				<l-circle-marker
					:ref="el => setRef('circle-' + mainStore.measure.points[0]?.id, el, markerRefs)"
					:lat-lng="
						mainStore.getPointCoords(
							mainStore.measure.points[0].id
						) as LatLngExpression
					"
					class-name="marker-start"
					:radius="13"
					:weight="1"
				/>
				<l-circle-marker
					:ref="el => setRef('circle-' + mainStore.measure.points.at(-1)?.id, el, markerRefs)"
					:lat-lng="pointCoordsByIndex(mainStore.measure.points, -1) ?? [0, 0]"
					class-name="marker-end"
					:radius="13"
					:weight="1"
				/>
				<l-polyline
					v-if="mainStore.measure.points.length > 1"
					:ref="el => setRef('measureId', el, routeLineRefs)"
					:lat-lngs="
						mainStore.getPointsCoords(
							mainStore.measure.points.map(p => p.id)
						) as LatLngExpression[]
					"
					color="rgba(0, 0, 0, 0.5)"
					:weight="2"
				/>
				<l-polyline
					v-if="mainStore.measure.points.length > 1"
					:ref="el => setRef('measureId', el, routeLineForEventRefs)"
					:lat-lngs="
						mainStore.getPointsCoords(
							mainStore.measure.points.map(p => p.id)
						) as LatLngExpression[]
					"
					color="rgba(0, 0, 0, 0)"
					:weight="20"
				/>
			</l-layer-group>

<!-- SEC Markers: Temps  -->

			<l-layer-group v-if="
				mainStore.markersShow &&
				mainStore.tempsShow.show
			">
				<template
					v-for="fat in mainStore.notMeasureFatTemps.points"
					:key="fat.key"
				>
					<l-marker
						:lat-lng="[ fat.point.latitude, fat.point.longitude ]"
						:visible="fat.point.show"
						:z-index-offset="fat.point.id === mainStore.currentPointId ? 10000 : 0"
						draggable
						@click="mainStore.setCurrentPoint(fat.point, false)"
						@contextmenu="(e: any) => {
							if (mainStore.mode !== 'normal' && e.originalEvent.shiftKey) {
								markerAddPoint(fat.point);
							} else {
								markerContextMenu(e, fat.point);
							}
						}"
						@dblclick="() => {
							if (mainStore.mode !== 'normal' && common.compact === 2) {
								markerAddPoint(fat.point);
							}
						}"
						@dragstart="dragging = true"
						@dragend="(e: any) => {
							dragging = false;
							markerDragEnd(fat.point.id, e);
						}"
					>
						<l-icon
							v-bind="(fat.point.id === mainStore.currentPointId
								? icon_temp_active
								: icon_temp
							) as {}"
						/>
					</l-marker>
				</template>
			</l-layer-group>
		</l-map>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import L from "leaflet";
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
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { Point, Place, Route, Measure, PointDescription } from '@/types';
import { isPointDescription } from '@/guards';
import { common } from '@/services/common';
import { calculatePopupPosition } from '@/shared/common';
import { mapContextMenu } from '@/shared/map';

const mainStore = useMainStore();

const map = inject('extmap') as Ref;

const mapCenter = computed(() => ({
	coords: [
		mainStore.center.latitude,
		mainStore.center.longitude,
	],
	zoom: mainStore.zoom,
}));

const preparePlaces = (dict: Record<string, Place>): Record<string, Place> => {
	const prepared: Record<string, Place> = {};
	for (const key of Object.keys(dict)) {
		if (!dict[key].deleted) prepared[key] = dict[key];
	}
	return prepared;
};
const computedPlaces = computed(() => preparePlaces(mainStore.places));
const computedCommonPlaces = computed(() => preparePlaces(mainStore.commonPlaces));

const computedRoutes = computed(() => {
	const prepared: Record<string, Route> = {};
	for (const key of Object.keys(mainStore.routes)) {
		if (!mainStore.routes[key].deleted && mainStore.routes[key].geomarks === 1) {
			prepared[key] = mainStore.routes[key];
		}
	}
	return prepared;
});
const computedRoutePointsArray = (descs: PointDescription[]): Point[] => {
	const prepared: Point[] = [];
	for (const desc of descs) {
		if (mainStore.points[desc.id] && !mainStore.points[desc.id].deleted) {
			prepared.push(mainStore.points[desc.id]);
		}
	}
	return prepared;
};

const dragging = ref(false);

const markerRefs = {} as Record<string, any>;
const routeLineRefs = {} as Record<string, { element: any, pointIds: string[] }>;
const routeLineForEventRefs = {} as Record<string, { element: any, pointIds: string[] }>;

const setRef = async (id: string, el: any, refs: any) => {
	await nextTick();
	if (el) {
		const element = el.leafletObject;
		if (refs === markerRefs) {
			refs[id] = element;
		} else if (refs === routeLineRefs || refs === routeLineForEventRefs) {
			refs[id] = {
				element: element,
				pointIds:
					id === 'measureId'
						? mainStore.measure.points.map(p => p.id)
						: (mainStore.routes[id]?.points.map(p => p.id) ?? [])
				,
			};
		}
		if (refs === routeLineForEventRefs) {
			if (element._customClick) element.off('click', element._customClick);
			if (element._customDblClick) element.off('dblclick', element._customDblClick);
			if (element._clickTimeout) clearTimeout(element._clickTimeout);
			element._customClick = (event: any) => {
				L.DomEvent.stopPropagation(event);
				if (element._clickTimeout) clearTimeout(element._clickTimeout);
				element._clickTimeout = setTimeout(() => {
					mainStore.setCurrentRoute(id, false);
					element._clickTimeout = null;
				}, 220);
			};
			element._customDblClick = (event: any) => {
				L.DomEvent.stopPropagation(event);
				if (element._clickTimeout) {
					clearTimeout(element._clickTimeout);
					element._clickTimeout = null;
				}
				const latlngs = element.getLatLngs();
				let minDistance = Infinity;
				let segmentIndex = 0;
				for (let i = 0; i < latlngs.length - 1; i++) {
					const d = L.LineUtil.pointToSegmentDistance(
						event.layerPoint,
						map.value.leafletObject.latLngToLayerPoint(latlngs[i]),
						map.value.leafletObject.latLngToLayerPoint(
							latlngs[i + 1],
						),
					);
					if (d < minDistance) {
						minDistance = d;
						segmentIndex = i;
					}
				}
				const { lat, lng } = event.latlng;
				const route =
					id === 'measureId'
						? mainStore.measure
						: mainStore.routes[id]
				;
				if (!route) return;
				const point = mainStore.upsertPoint({
					props: { latitude: lat, longitude: lng },
					where: id === 'measureId' ? mainStore.temps : mainStore.points,
				});
				if (point) mainStore.addPointToPoints({
					point: point,
					entity: route,
					index: segmentIndex + 1,
				});
			};
			element.on('click', element._customClick);
			element.on('dblclick', element._customDblClick);
		}
	} else {
		if (refs === routeLineForEventRefs && refs[id]?.element) {
			const element = refs[id].element;
			if (element._clickTimeout) {
				clearTimeout(element._clickTimeout);
				delete element._clickTimeout;
			}
			if (element._customClick) {
				element.off('click', element._customClick);
				delete element._customClick;
			}
			if (element._customDblClick) {
				element.off('dblclick', element._customDblClick);
				delete element._customDblClick;
			}
		}
		delete refs[id];
	}
};
const pointToLinesMap = computed(() => {
	const mapping: Record<string, { lineId: string; index: number }[]> = {};
	for (const [lineId, refData] of Object.entries(routeLineRefs)) {
		refData.pointIds.forEach((pId, idx) => {
			if (!mapping[pId]) mapping[pId] = [];
			mapping[pId].push({ lineId, index: idx });
		});
	}
	return mapping;
});
const pointCoordsByIndex = (points: PointDescription[], index: number): LatLngExpression | undefined => {
	const point = points.at(index);
	if (!isPointDescription(point)) return;
	return mainStore.getPointCoords(point.id) as LatLngExpression;
};
const moveMarker = (e: any, pointId: string, lineId?: string, pointIndex?: number) => {
	const { lat, lng } = e.target.getLatLng();
	const updatePolyline = (lId: string, pIdx: number) => {
		const polyline = routeLineRefs[lId];
		if (polyline?.element) {
			const latLngs = polyline.element.getLatLngs();
			if (latLngs[pIdx]) {
				latLngs[pIdx] = [lat, lng];
				polyline.element.setLatLngs(latLngs);
			}
		}
	};
	if (lineId !== undefined && pointIndex !== undefined) {
		updatePolyline(lineId, pointIndex);
	} else {
		const targets = pointToLinesMap.value[pointId];
		if (targets) {
			targets.forEach(target => updatePolyline(target.lineId, target.index));
		}
	}
	markerRefs['circle-' + pointId]?.setLatLng([lat, lng]);
};

// SEC Right clicks

const leafletMapContextMenu = (e: any) => {
	mapContextMenu(e.originalEvent, e.latlng.lat, e.latlng.lng);
}
const markerContextMenu = (
	e: any,
	point: Point,
	of?: Place | Route | Measure,
) => {
	e.originalEvent.stopPropagation();
	e.originalEvent.preventDefault();
	if (common.popupProps.show && common.pointInfo?.point.id === point.id) {
		common.hidePopup();
		common.clearPointInfo();
	} else {
		common.setPointInfo({ id: point.id, entity: of });
		common.showPopup(calculatePopupPosition(e.originalEvent));
	}
};
const markerAddPoint = (point: Point) => {
	switch (mainStore.mode) {
		case 'routes':
			if (
				mainStore.currentRoute &&
				point.id !== mainStore.currentRoute.points.at(-1)?.id &&
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

const markerDragEnd = async (pointId: string, event: any) => {
	const point = mainStore.getPointById(pointId);
	if (!point) return;
	const coordinates = event.target.getLatLng();
	mainStore.changePoint({
		entity: point,
		change: {
			latitude: Number(coordinates.lat.toFixed(7)),
			longitude: Number(coordinates.lng.toFixed(7)),
		},
	});
};
const updateState = (payload?: { coords?: number[], zoom?: number }) => {
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

<style lang="scss">
.leaflet-touch .leaflet-control-attribution,
.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
	box-shadow: 0 1px 5px var(--color-02);
	border: none;
}
.leaflet-control-geosearch form {
	height: 100% !important;
}
.leaflet-control-geosearch .glass {
	height: 100%;
	background-color: var(--color-65);
}
.marker-start {
	fill: rgb(0, 165, 242) !important;
	fill-opacity: 0.7;
	stroke: rgb(255, 255, 255) !important;
	stroke-opacity: 0.7;
	stroke-width: 2px;
}
.marker-end {
	fill: rgb(242 156 0) !important;
	fill-opacity: 0.7;
	stroke: rgb(255, 255, 255) !important;
	stroke-opacity: 0.7;
	stroke-width: 2px;
}
.marker-intermediate {
	fill: rgb(0, 0, 0) !important;
	fill-opacity: 0.2;
	stroke: rgb(255, 255, 255) !important;
	stroke-opacity: 0.5;
	stroke-width: 2px;
}
</style>
<style lang="scss" scoped>
* {
	user-select: none;
}
</style>

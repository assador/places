<template>
	<div id="mapblock">
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
		>
			<yandex-map-listener
				:settings="{
					onActionEnd: () => updateState(),
					onContextMenu: (_, e) => mapContextMenu(e.coordinates.reverse()),
				}"
			/>

<!-- SEC Markers: Center Marker  -->

			<yandex-map-marker
				v-model="markerCenter"
				:settings="{
					...mapCenter,
					draggable: true,
					onDragEnd: e => updateState({ coords: e.reverse() }),
				}"
				:visible="mainStore.centerPlacemarkShow"
			>
				<img
					class="marker-center"
					:src="placemarksOptions.icon_center.iconUrl"
					:title="mainStore.t.i.maps.center"
				/>
			</yandex-map-marker>

<!-- SEC Markers: Place Markers  -->

			<yandex-map-marker
				v-for="place in computedPlaces"
				:key="place.key"
				v-model="markers[place.id]"
				:settings="{
					coordinates: [
						mainStore.points[place.pointid].longitude,
						mainStore.points[place.pointid].latitude,
					],
					draggable: true,
					onDragStart: () => { dragging = true },
					onDragEnd: e => {
						dragging = false;
						markerDragEnd(place, e);
					},
				}"
				:visible="mainStore.placemarksShow && place.show && place.geomark"
				class="place"
				@click="mainStore.setCurrentPlace(place, false)"
				@contextmenu.prevent.stop="e =>
					markerContextMenu(e, mainStore.points[place.pointid], place)
				"
			>
				<img
					class="marker"
					:src="placemarksOptions[
						place.added &&
						!place.updated &&
						mainStore.points[place.pointid].added &&
						!mainStore.points[place.pointid].updated
							? 'icon_new'
							: (
								place.id === mainStore.currentPlace.id
									? 'icon_active'
									: 'icon_basic'
							)
					].iconUrl"
					:title="place.name"
				/>
			</yandex-map-marker>

<!-- SEC Markers: Common Place Markers  -->

			<yandex-map-marker
				v-for="place in computedCommonPlaces"
				:key="place.key"
				v-model="markers[place.id]"
				:settings="{
					coordinates: [
						mainStore.points[place.pointid].longitude,
						mainStore.points[place.pointid].latitude,
					],
					draggable: false,
				}"
				:visible="mainStore.commonPlacemarksShow && place.geomark"
				@click="mainStore.setCurrentPoint(mainStore.points[place.pointid], false)"
				@contextmenu.prevent.stop="e =>
					markerContextMenu(e, mainStore.points[place.pointid], place)
				"
			>
				<img
					class="marker"
					:src="placemarksOptions[
						mainStore.mode === 'measure' &&
						mainStore.measure.points.find(p => p.id === place.id) &&
						place === mainStore.currentPlace
							? 'icon_common' : 'icon_common_active'
					].iconUrl"
					:title="place.name"
				/>
			</yandex-map-marker>

<!-- SEC Markers: Route Points  -->

			<template
				v-if="mainStore.mode === 'routes' && mainStore.routesShow"
			>
				<template
					v-for="route in computedRoutes"
					:key="route.id"
					class="route"
				>
					<yandex-map-feature
						v-model="routeLines[route.id]"
						:settings="{
							geometry: {
								type: 'LineString',
								coordinates: mainStore.getPointsCoords(
									route.points.map(p => p.id) ?? []
								).map(coords => coords.reverse()) as unknown as LngLat[],
							},
							style: {
								stroke: [{
									color: '#000000',
									width: route.id === mainStore.currentRoute.id
										? 0.6 : 0.3
									,
								}]
							}
						}"
					/>
					<yandex-map-feature
						v-model="routeLines[route.id]"
						:settings="{
							geometry: {
								type: 'LineString',
								coordinates: mainStore.getPointsCoords(
									route.points.map(p => p.id) ?? []
								).map(coords => coords.reverse()) as unknown as LngLat[],
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
						v-for="point in route.computedRoutePoints"
						:key="point.idx"
					>
						<yandex-map-marker
							v-model="markers[point.id]"
							:settings="{
								coordinates: [
									point.longitude,
									point.latitude,
								],
								draggable: true,
								onDragStart: () => { dragging = true },
								onDragEnd: e => {
									dragging = false;
									markerDragEnd(mainStore.getPointById(point.id), e);
								},
								onDragMove: e => {
									const lineInstance = routeLines[route.id];
									if (lineInstance && lineInstance.geometry) {
										const coords = [
											...lineInstance.geometry.coordinates
										];
										const pointIndex = route.points.findIndex(
											p => p.id === point.id
										);
										if (pointIndex !== -1) {
											coords[pointIndex] = [ e[0], e[1] ];
											lineInstance.update({
												geometry: {
													type: 'LineString',
													coordinates: coords,
												},
											});
										}
									}
								},
							}"
							:visible="
								mainStore.placemarksShow &&
								mainStore.tempsPlacemarksShow &&
								point.show
							"
							@click="mainStore.setCurrentPoint(
								mainStore.getPointById(point.id), false)
							"
							@contextmenu.prevent.stop="e =>markerContextMenu(
								e,
								mainStore.getPointById(point.id),
								mainStore.currentRoute
							)"
						>
							<div
								v-if="point.id === route.points[0].id"
								class="marker-start"
								:class="{
									'marker-current': route.id === mainStore.currentRoute.id
								}"
							/>
							<div
								v-else-if="point.id === route.points.at(-1).id"
								class="marker-end"
								:class="{
									'marker-current': route.id === mainStore.currentRoute.id
								}"
							/>
							<div
								v-else
								class="marker-intermediate"
								:class="{
									'marker-current': route.id === mainStore.currentRoute.id
								}"
							/>
							<img
								v-if="point.id === mainStore.currentPoint.id"
								:src="placemarksOptions.icon_active.iconUrl"
								class="marker"
							/>
						</yandex-map-marker>
					</template>
				</template>
			</template>

<!-- SEC Markers: Temps  -->

			<yandex-map-feature
				v-if="mainStore.mode === 'measure'"
				v-model="routeLines['measureId']"
				:settings="{
					geometry: {
						type: 'LineString',
						coordinates: mainStore.getPointsCoords(
							mainStore.measure.points.map(p => p.id) ?? []
						).map(coords => coords.reverse()) as unknown as LngLat[],
					},
					style: {
						stroke: [{
							color: '#000000',
							width: 0.6
							,
						}]
					}
				}"
			/>
			<yandex-map-feature
				v-if="mainStore.mode === 'measure'"
				v-model="routeLines['measureId']"
				:settings="{
					geometry: {
						type: 'LineString',
						coordinates: mainStore.getPointsCoords(
							mainStore.measure.points.map(p => p.id) ?? []
						).map(coords => coords.reverse()) as unknown as LngLat[],
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
				v-for="point in computedTemps"
				:key="point.key"
			>
				<yandex-map-marker
					v-model="markers[point.id]"
					:settings="{
						coordinates: [
							point.longitude,
							point.latitude,
						],
						draggable: true,
						onDragStart: () => { dragging = true },
						onDragEnd: e => {
							dragging = false;
							markerDragEnd(mainStore.getPointById(point.id), e);
						},
						onDragMove: e => {
							const lineInstance = routeLines['measureId'];
							if (lineInstance && lineInstance.geometry) {
								const coords = [
									...lineInstance.geometry.coordinates
								];
								const pointIndex = mainStore.measure.points.findIndex(
									p => p.id === point.id
								);
								if (pointIndex !== -1) {
									coords[pointIndex] = [ e[0], e[1] ];
									lineInstance.update({
										geometry: {
											type: 'LineString',
											coordinates: coords,
										},
									});
								}
							}
						},
					}"
					:visible="
						mainStore.placemarksShow &&
						mainStore.tempsPlacemarksShow &&
						point.show
					"
					@click="mainStore.setCurrentPoint(
						mainStore.getPointById(point.id), false)
					"
					@contextmenu.prevent.stop="e => markerContextMenu(
						e,
						mainStore.getPointById(point.id),
						mainStore.currentRoute
					)"
				>
					<template v-if="mainStore.mode === 'measure'">
						<div
							v-if="
								point.id === mainStore.measure.points[0]?.id
							"
							class="marker-current marker-start"
						/>
						<div
							v-else-if="point.id === mainStore.measure.points.at(-1)?.id"
							class="marker-current marker-end"
						/>
						<div
							v-else
							class="marker-current marker-intermediate"
						/>
					</template>
					<img
						v-if="
							mainStore.mode === 'measure' &&
							mainStore.isMeasurePoint(point.id) &&
							point.id === mainStore.currentPoint.id
						"
						:src="placemarksOptions.icon_active.iconUrl"
						class="marker"
					/>
					<img
						v-else-if="!mainStore.isMeasurePoint(point.id)"
						:src="placemarksOptions[
							point.id === mainStore.currentPoint.id
								? 'icon_temp_active' : 'icon_temp'
						].iconUrl"
						class="marker"
					/>
				</yandex-map-marker>
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
import { ref, Ref, shallowRef, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
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
import type { YMap, LngLat } from '@yandex/ymaps3-types';
import { Place, Route, Measure, Point, PointName } from '@/types';
import { IPlacesPopupProps, getPointToSegmentDistance } from '@/shared';

const mainStore = useMainStore();

const pointInfo = inject<Ref<PointName>>('pointInfo')!;
const popupProps = inject<Ref<IPlacesPopupProps>>('popupProps')!;

const map = shallowRef<YMap | null>(null);
const markers = shallowRef({});
const markerCenter = shallowRef(null);
const routeLines = ref({});
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

// SEC Right clicks

const mapContextMenu = (coords: number[]) => {
	const [ lat, lng ] = coords;
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
	popupProps.value.show = pointInfo.value.point?.id === point.id
		? !popupProps.value.show : true
	;
	pointInfo.value.point = point;
	popupProps.value.position.left = 'auto';
	popupProps.value.position.bottom = 'auto';
	popupProps.value.position.top = e.clientY + 5;
	popupProps.value.position.right =
		e.view.document.documentElement.clientWidth -
		e.clientX + 5;
}

// SEC Other

const markerDragEnd = async (point: Place | Point, event) => {
	mainStore.changePoint({
		entity: (
			point.type === 'point'
				? point
				: mainStore.points[(point as Place).pointid]
		),
		change: {
			latitude: Number(event[1].toFixed(7)),
			longitude: Number(event[0].toFixed(7)),
		},
	});
};
const addPointToRoute = (route: Route | Measure, coordinates: any) => {
	const routePointCoordinates =
		mainStore.getPointsCoords(route.points.map(p => p.id) ?? [])
			.map(coords => coords.reverse())
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
const updateState = (payload?: { coords?: Array<number>, zoom?: number }) => {
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
/*
	icon_01_grey: {
		iconUrl: '/img/markers/marker_01_grey.svg',
	},
	icon_temp_faded: {
		iconUrl: '/img/markers/marker_01_blue_faded.svg',
	},
*/
});
</script>

<style lang="scss" scoped>
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

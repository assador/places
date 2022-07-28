<template>
	<div id="mapblock">
		<l-map
			ref="map"
			v-model:zoom="mapCenter.zoom"
			:center="mapCenter.coords"
			@ready="ready()"
			@moveend="
				updateState({
					coords: [
						$event.target.getCenter().lat,
						$event.target.getCenter().lng,
					],
					zoom: $event.target.getZoom(),
				});
			"
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
				@moveend="
					updateState({
						coords: [
							$event.target.getLatLng().lat,
							$event.target.getLatLng().lng,
						],
					});
				"
			>
				<l-icon v-bind="icon_03" />
				<l-tooltip>
					{{ $store.state.t.i.maps.center }}
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
				@click="placemarkClick(place);"
				@mousedown="placemarkDragStart(place, $event);"
				@mouseup="placemarkDragEnd(place, $event);"
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

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapState } from 'vuex';
import { emitter } from '@/shared/bus';
import { constants } from '@/shared/constants';
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
import {
	Place,
	Waypoint,
} from '@/store/types';

export default defineComponent({
	components: {
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
	},
	data() {
		return {
			map: null,
			placemarksOptions: {
				private: {
					draggable: true,
				},
				common: {
					draggable: false,
				},
			},
			centerPlacemarkOptions: {
				draggable: true,
			},
			updatingMap: false,
			icon_01: {
				iconUrl: '../img/markers/marker_01.svg',
				iconSize: [25, 38],
				iconAnchor: [13, 38],
				popupAnchor: [0, -34],
				shadowUrl: '../img/markers/marker_01_shadow.svg',
				shadowSize: [25, 38],
				shadowAnchor: [2, 24],
			},
			icon_02: {
				iconUrl: '../img/markers/marker_02.svg',
				iconSize: [25, 38],
				iconAnchor: [13, 38],
				popupAnchor: [0, -34],
				shadowUrl: '../img/markers/marker_01_shadow.svg',
				shadowSize: [25, 38],
				shadowAnchor: [2, 24],
			},
			icon_03: {
				iconUrl: '../img/markers/marker_03.svg',
				iconSize: [25, 38],
				iconAnchor: [13, 38],
				popupAnchor: [0, -34],
				shadowUrl: '../img/markers/marker_01_shadow.svg',
				shadowSize: [25, 38],
				shadowAnchor: [2, 24],
			},
			providers: [{
				name: this.$store.state.t.i.maps.osm,
				url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				visible: true,
			}, {
				name: this.$store.state.t.i.maps.satellite,
				url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				visible: false,
			}, {
				name: this.$store.state.t.i.maps.topography,
				url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
				visible: false,
			}, {
				name: this.$store.state.t.i.maps.tourists,
				url: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
				visible: false,
			}, {
				name: this.$store.state.t.i.maps.transport,
				url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=4857a14b2e4941b6a587f313a2ae6144',
				visible: false,
			}, {
				name: this.$store.state.t.i.maps.aero,
				url: 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
				visible: false,
			}, {
				name: this.$store.state.t.i.maps.bicycles,
				url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
				visible: false,
			}, {
				name: this.$store.state.t.i.maps.railroads,
				url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
				visible: false,
			}],
		};
	},
	computed: {
		...mapState([
			'currentPlace',
			'placemarksShow',
			'commonPlacemarksShow',
			'centerPlacemarkShow',
			'places',
			'commonPlaces',
			'waypoints',
		]),
		mapCenter(): Record<string, Array<number> | number> {
			return {
				coords: [
					this.$store.state.center.latitude,
					this.$store.state.center.longitude,
				],
				zoom: this.$store.state.zoom,
			};
		},
	},
	methods: {
		placemarkClick(place, e) {
			emitter.emit('setCurrentPlace', {place: place});
			if (place.common) {
				const inPaginator =
					Object.keys(this.$store.state.commonPlaces).indexOf(place.id) /
					this.$parent.commonPlacesOnPageCount
				;
				this.$parent.commonPlacesPage = (
					Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
				);
			}
		},
		placemarkDragStart(place, event) {
			if (place !== this.currentPlace) {
				event.target.dragging.disable();
				this.$store.dispatch('setMessage',
					this.$store.state.t.m.popup.needToChoosePlacemark
				);
			}
		},
		placemarkDragEnd(place, event) {
			event.target.dragging.enable();
			const coordinates = event.target.getLatLng();
			this.$store.dispatch('changePlace', {
				place: place,
				change: {
					latitude: Number(coordinates.lat.toFixed(7)),
					longitude: Number(coordinates.lng.toFixed(7)),
				},
			});
			this.updateState(coordinates);
		},
		updateState(payload?: {coords: Array<number>, zoom: number}) {
			this.$store.dispatch('changeMap', {
				latitude: Number(
					payload && payload.coords
						? payload.coords[0].toFixed(7)
						: this.map.getCenter().lat.toFixed(7)
				),
				longitude: Number(
					payload && payload.coords
						? payload.coords[1].toFixed(7)
						: this.map.getCenter().lng.toFixed(7)
				),
				zoom: Number(
					payload && payload.zoom
						? payload.zoom
						: this.map.getZoom()
				),
			});
		},
		ready() {
			this.map = this.$refs.map.leafletObject;
			this.map.panTo(this.mapCenter.coords);
		},
	},
});
</script>

<template>
	<yandex-map
		id="mapblock"
		ref="map"
		:coords="mapCenter.coords"
		:center="mapCenter.coords"
		:zoom="mapCenter.zoom"
		@map-was-initialized="mapHandler"
		@mouseup="updateState()"
		@wheel="updateState();"
	>
		<ymap-marker
			ref="centerMarker"
			marker-id="centerMarker"
			:coords="mapCenter.coords"
			:hint-content="$store.state.t.i.maps.center"
			:balloon="{body: $store.state.t.i.maps.centerExt}"
			:options="{
				visible: centerPlacemarkShow,
				...placemarksOptions.basic,
				...placemarksOptions.center,
				...placemarksOptions.icon_06,
			}"
			@dragend="
				updateState({
					coords: $event.originalEvent.target.geometry._coordinates,
				});
			"
		/>
		<ymap-marker
			v-for="(place, id) in places"
			:key="id"
			:marker-id="place.id"
			:coords="[
				waypoints[place.waypoint] ? waypoints[place.waypoint].latitude : 0,
				waypoints[place.waypoint] ? waypoints[place.waypoint].longitude : 0,
			]"
			:hint-content="place.name"
			:balloon="{body: place.description}"
			:options="{
				visible: placemarksShow && place.show && place.geomark,
				...placemarksOptions.basic,
				...placemarksOptions.private,
				...placemarksOptions[currentPlace && id === currentPlace.id ? 'icon_06' : 'icon_04'],
			}"
			:properties="{
				place: place,
			}"
			@click="placemarkClick($event);"
			@dragstart="placemarkDragStart($event);"
			@dragend="placemarkDragEnd($event);"
		/>
		<ymap-marker
			v-for="(place, id) in commonPlaces"
			:key="id"
			:marker-id="place.id"
			:coords="[waypoints[place.waypoint].latitude, waypoints[place.waypoint].longitude]"
			:hint-content="place.name"
			:balloon="{body: place.description}"
			:options="{
				visible: commonPlacemarksShow && place.show && place.geomark,
				...placemarksOptions.basic,
				...placemarksOptions.common,
				...placemarksOptions[currentPlace && id === currentPlace.id ? 'icon_06' : 'icon_05'],
			}"
			:properties="{
				place: place,
			}"
			@click="placemarkClick($event);"
		/>
	</yandex-map>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { emitter } from '@/shared/bus';
import { ResizeSensor } from 'css-element-queries'
import { mapState } from 'vuex';
import { constants } from '@/shared/constants';
import { YmapPlugin, loadYmap, yandexMap, ymapMarker } from 'vue-yandex-maps';
import { Place, Waypoint } from '@/store/types';

export default defineComponent({
	components: {
		yandexMap,
		ymapMarker,
	},
	data() {
		return {
			map: null as unknown as yandexMap,
			placemarksOptions: {
				basic: {
					iconLayout: 'default#image',
					iconImageSize: [25, 38],
					iconImageOffset: [0, -34],
				},
				private: {
					draggable: true,
				},
				common: {
					draggable: false,
				},
				active: {
					draggable: true,
				},
				center: {
					draggable: true,
				},
				icon_04: {
					iconImageHref: '/img/markers/marker_04.svg',
				},
				icon_05: {
					iconImageHref: '/img/markers/marker_05.svg',
				},
				icon_06: {
					iconImageHref: '/img/markers/marker_06.svg',
				},
			},
			updatingMap: false,
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
	watch: {
		placemarksShow() {
			if (this.placemarksShow) {
				this.placemarksOptions.private.visible = true;
			} else {
				this.placemarksOptions.private.visible = false;
			}
		},
		commonPlacemarksShow() {
			if (this.commonPlacemarksShow) {
				this.placemarksOptions.common.visible = true;
			} else {
				this.placemarksOptions.common.visible = false;
			}
		},
		centerPlacemarkShow() {
			if (this.centerPlacemarkShow) {
				this.placemarksOptions.center.visible = true;
			} else {
				this.placemarksOptions.center.visible = false;
			}
		},
	},
	mounted() {
		new ResizeSensor(document.getElementById('basic-basic') as HTMLElement, () => {
			this.fitMap();
		});
	},
	methods: {
		mapHandler(map) {
			this.map = map;
			this.map.controls.add('routeButtonControl', {});
			this.map.behaviors.enable('scrollZoom');
			this.$parent.commonPlacesShowHide(
				this.$store.state.commonPlacemarksShow
			);
		},
		placemarkClick(e) {
			e.get('target').options.set(
				'draggable',
				e.get('target').properties.get('place.common') ? false : true
			);
			emitter.emit(
				'setCurrentPlace',
				{place: e.get('target').properties.get('place')}
			);
			if (e.get('target').properties.get('place.common')) {
				const inPaginator =
					Object.keys(this.commonPlaces)
						.indexOf(e.get('target').properties.get('place.id')) /
						this.$parent.commonPlacesOnPageCount
				;
				this.$parent.commonPlacesPage = (
					Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
				);
			}
		},
		placemarkDragStart(e) {
			if (e.get('target').properties.get('place.id') !== this.currentPlace.id) {
				e.get('target').options.set({draggable: false});
				this.$store.dispatch('setMessage',
					this.$store.state.t.m.popup.needToChoosePlacemark
				);
			}
		},
		placemarkDragEnd(e) {
			e.get('target').options.set({draggable: true});
			if (e.get('target').properties.get('place.id') === this.currentPlace.id) {
				const coordinates = e.get('target').geometry.getCoordinates();
				this.$store.dispatch('changePlace', {
					place: e.get('target').properties.get('place'),
					change: {
						latitude: Number(coordinates[0].toFixed(7)),
						longitude: Number(coordinates[1].toFixed(7)),
					},
				});
				this.updateState({coords: coordinates});
			}
		},
		updateState(payload?: {coords: Array<number>, zoom: number}) {
			this.$store.dispatch('updateMap', {
				latitude: Number(
					payload && payload.coords
						? payload.coords[0].toFixed(7)
						: this.map.getCenter()[0].toFixed(7)
				),
				longitude: Number(
					payload && payload.coords
						? payload.coords[1].toFixed(7)
						: this.map.getCenter()[1].toFixed(7)
				),
				zoom: Number(
					payload && payload.zoom
						? payload.zoom
						: this.map.getZoom()
				),
			});
		},
		fitMap() {
			if (this.map !== null) {
				const mapblock = document.getElementById('mapblock') as HTMLElement;
				mapblock.style.right = '100%';
				this.map.container.fitToViewport();
				if (!this.$parent.compact) {
					mapblock.style.right = '12px';
				} else {
					mapblock.style.right = '0';
				}
				this.map.container.fitToViewport();
			}
		},
	},
});
</script>

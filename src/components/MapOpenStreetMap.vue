<template>
	<div id="mapblock" />
</template>

<script lang="ts">
import Vue from 'vue';
import { bus } from '../shared/bus';
import L, { Marker, LayerGroup } from 'leaflet';
//import 'leaflet-css';
import 'leaflet-providers';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import 'leaflet-fullscreen';
import 'leaflet-geosearch/dist/geosearch.css';
import * as GeoSearch from 'leaflet-geosearch';
import { mapState } from 'vuex';
import { Place } from '@/store/types';

export default Vue.extend({
	props: [
		'id',
		'name',
		'description',
		'images',
		'latitude',
		'longitude',
		'centerLatitude',
		'centerLongitude',
		'zoom',
		'geomarksVisibility',
	],
	data() {
		return {
			map: null as unknown as L,
			mrk: null as unknown as Marker,
			mrks: {} as Record<string, Marker>,
			commonMrks: {} as Record<string, Marker>,
			markersLayer: null as unknown as LayerGroup,
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
			icon_01: L.icon({
				iconUrl: '../img/markers/marker_01.png',
				iconSize: [25, 38],
				iconAnchor: [13, 38],
				popupAnchor: [0, -34],
				shadowUrl: '../img/markers/marker_01_shadow.png',
				shadowSize: [18, 10],
				shadowAnchor: [0, 10],
			}),
			icon_02: L.icon({
				iconUrl: '../img/markers/marker_02.png',
				iconSize: [25, 38],
				iconAnchor: [13, 38],
				popupAnchor: [0, -34],
				shadowUrl: '../img/markers/marker_02_shadow.png',
				shadowSize: [18, 10],
				shadowAnchor: [0, 10],
			}),
			icon_03: L.icon({
				iconUrl: '../img/markers/marker_03.png',
				iconSize: [25, 38],
				iconAnchor: [13, 38],
				popupAnchor: [0, -34],
				shadowUrl: '../img/markers/marker_03_shadow.png',
				shadowSize: [18, 10],
				shadowAnchor: [0, 10],
			}),
		}
	},
	computed: {
		...mapState([
			'currentPlace',
			'placemarksShow',
			'commonPlacemarksShow',
			'centerPlacemarkShow',
		]),
	},
	watch: {
		latitude() {
			this.updatePlacemark(
				(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
			if (this.currentPlace) {
				this.$store.dispatch('changeMap', {
					latitude: this.$store.state.waypoints[this.currentPlace.waypoint].latitude,
					longitude: this.$store.state.waypoints[this.currentPlace.waypoint].longitude,
				});
			}
		},
		longitude() {
			this.updatePlacemark(
				(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
			if (this.currentPlace) {
				this.$store.dispatch('changeMap', {
					latitude: this.$store.state.waypoints[this.currentPlace.waypoint].latitude,
					longitude: this.$store.state.waypoints[this.currentPlace.waypoint].longitude,
				});
			}
		},
		centerLatitude() {
			this.updateMap();
		},
		centerLongitude() {
			this.updateMap();
		},
		zoom() {
			this.updateMap();
		},
		name() {
			this.updatePlacemark(
				(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
		},
		description() {
			this.updatePlacemark(
				(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
		},
		geomarksVisibility() {
			for (let id in this.geomarksVisibility) {
				if (this.mrks[id]) {
					if (this.geomarksVisibility[id]) {
						this.map.addLayer(this.mrks[id]);
					} else {
						this.map.removeLayer(this.mrks[id]);
					}
				}
			}
		},
		placemarksShow() {
			for (let key in this.mrks) {
				if (this.$store.state.placemarksShow) {
					this.map.addLayer(this.mrks[key]);
				} else {
					this.map.removeLayer(this.mrks[key]);
				}
			}
		},
		commonPlacemarksShow() {
			for (let key in this.commonMrks) {
				if (this.$store.state.commonPlacemarksShow) {
					this.map.addLayer(this.commonMrks[key]);
				} else {
					this.map.removeLayer(this.commonMrks[key]);
				}
			}
		},
		centerPlacemarkShow() {
			if (this.$store.state.centerPlacemarkShow) {
				this.map.addLayer(this.mrk);
			} else {
				this.map.removeLayer(this.mrk);
			}
		},
	},
	created() {
		bus.$on('refreshMapOpenStreetMapMarks', () => {
			this.markersLayer.clearLayers();
			this.mrks = {};
			for (const id in this.$store.state.places) {
				this.appendPlacemark(this.mrks, this.$store.state.places[id], 'private');
			}
			if (this.currentPlace) {
				if (
					!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
					this.mrks[this.currentPlace.id]
				) {
					this.mrks[this.currentPlace.id].setIcon(this.icon_03);
				} else if (this.commonMrks[this.currentPlace.id]) {
					this.commonMrks[this.currentPlace.id].setIcon(this.icon_03);
				}
			}
		});
	},
	beforeDestroy() {
		bus.$off('refreshMapOpenStreetMapMarks');
		if (this.map) {
			this.map.remove();
		}
	},
	methods: {
		showMap(lat: number, lng: number, zoom: number) {
			const thunderforestAPI = '4857a14b2e4941b6a587f313a2ae6144';
			const
				osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 18,
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				}),
				satellite  = L.tileLayer.provider('Esri.WorldImagery'),
				topography = L.tileLayer.provider('Thunderforest.Landscape', {apikey: thunderforestAPI}),
				tourists   = L.tileLayer.provider('Thunderforest.Outdoors', {apikey: thunderforestAPI}),
				transport  = L.tileLayer.provider('Thunderforest.Transport', {apikey: thunderforestAPI}),
				aero       = L.tileLayer.provider('OPNVKarte'),
				bicycles   = L.tileLayer.provider('CyclOSM'),
				railroads  = L.tileLayer.provider('OpenRailwayMap')
			;
			const baseMaps = {
				[this.$store.state.t.i.maps.satellite] : satellite,
				[this.$store.state.t.i.maps.topography] : topography,
				[this.$store.state.t.i.maps.tourists] : tourists,
				[this.$store.state.t.i.maps.transport] : transport,
				[this.$store.state.t.i.maps.aero] : aero,
				[this.$store.state.t.i.maps.bicycles] : bicycles,
				[this.$store.state.t.i.maps.osm] : osm,
			};
			const overlayMaps = {
				[this.$store.state.t.i.maps.railroads] : railroads,
			};
			this.map = L.map('mapblock', {
				center: [lat, lng],
				zoom: zoom,
				layers: [
					satellite,
					topography,
					tourists,
					transport,
					aero,
					bicycles,
					osm,
				],
				fullscreenControl: true,
				fullscreenControlOptions: {
					position: 'topleft',
				}
			});
			L.control.layers(baseMaps, overlayMaps).addTo(this.map);
			this.map.addControl(
				(GeoSearch.GeoSearchControl as any)({
					provider: new GeoSearch.OpenStreetMapProvider(),
				})
			);
			const updateState = () => {
				if (!this.updatingMap) {
					let coordinates = this.map.getCenter();
					this.$store.dispatch('changeMap', {
						latitude: Number(coordinates.lat.toFixed(7)),
						longitude: Number(coordinates.lng.toFixed(7)),
						zoom: Number(this.map.getZoom()),
					});
					this.mrk.setLatLng(coordinates);
				}
			}
			this.map.on('moveend', updateState);
			this.map.on('zoomend', updateState);
			this.mrk = L.marker([lat, lng], {icon: this.icon_03, ...this.centerPlacemarkOptions})
				.addTo(this.map)
				.bindPopup(this.$store.state.t.i.maps.center, {autoPan: false})
				.openPopup();
			if (!this.$store.state.centerPlacemarkShow) {
				this.map.removeLayer(this.mrk);
			}
			this.mrk.on('dragend', () => {
				this.map.setView(this.mrk.getLatLng());
			});
			this.markersLayer = L.layerGroup().addTo(this.map);
			for (const id in this.$store.state.places) {
				this.appendPlacemark(this.mrks, this.$store.state.places[id], 'private');
			}
			for (const id in this.$store.state.commonPlaces) {
				this.appendPlacemark(this.commonMrks, this.$store.state.commonPlaces[id], 'common');
			}
			(this.$parent as Vue & {commonPlacesShowHide(show: boolean): void})
				.commonPlacesShowHide(this.$store.state.commonPlacemarksShow);
			if (this.currentPlace) {
				if (
					!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
					this.mrks[this.currentPlace.id]
				) {
					this.mrks[this.currentPlace.id].setIcon(this.icon_03);
				} else if (
					this.commonMrks[this.currentPlace.id]
				) {
					this.commonMrks[this.currentPlace.id].setIcon(this.icon_03);
				}
			}
			updateState();
		},
		clickPlacemark(place: Place, type: string) {
			let marks = (type === 'common' ? this.commonMrks : this.mrks);
			if (type === 'common') {
				marks[place.id].dragging.disable();
			} else {
				marks[place.id].dragging.enable();
			}
			bus.$emit('setCurrentPlace', {place: place});
			if (type === 'common') {
				const inPaginator =
					Object.keys(this.$store.state.commonPlaces).indexOf(place.id) /
					(this.$parent as Vue & {commonPlacesOnPageCount: number}).commonPlacesOnPageCount
				;
				(this.$parent as Vue & {commonPlacesPage: number}).commonPlacesPage =
					(Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
					);
			}
		},
		appendPlacemark(marks: Record<string, Marker>, place: Place, type: string) {
			let options;
			switch (type) {
				case 'private' :
					options = {icon: this.icon_01, ...this.placemarksOptions.private};
					break;
				case 'common' :
					options = {icon: this.icon_02, ...this.placemarksOptions.common};
					break;
			}
			marks[place.id] = L.marker([
					this.$store.state.waypoints[place.waypoint].latitude,
					this.$store.state.waypoints[place.waypoint].longitude,
				], options)
				.addTo(this.markersLayer)
				.bindPopup(place.name, {autoPan: false});
			marks[place.id].on('dragstart', () => {
				if (place !== this.currentPlace) {
					marks[place.id].dragging.disable();
					this.$store.dispatch('setMessage',
						this.$store.state.t.m.popup.needToChoosePlacemark
					);
				}
			});
			marks[place.id].on('dragend', () => {
				if (place === this.currentPlace) {
					let coordinates = marks[place.id].getLatLng();
					this.$store.dispatch('changePlace', {
						place: place,
						change: {
							latitude: Number(coordinates.lat.toFixed(7)),
							longitude: Number(coordinates.lng.toFixed(7)),
						},
					});
				} else {
					this.clickPlacemark(place, type);
				}
			});
			marks[place.id].on('mouseup', () => {
				this.clickPlacemark(place, type);
			});
		},
		updatePlacemark(marks: Record<string, Marker>) {
			if (marks[this.id]) {
				marks[this.id].setLatLng({
					lat: this.latitude,
					lng: this.longitude,
				});
				marks[this.id].bindPopup(this.name, {autoPan: false});
			}
		},
		updateMap() {
			if (this.map !== null && !this.updatingMap) {
				this.updatingMap = true;
				this.map.setView({
					lat: this.centerLatitude,
					lng: this.centerLongitude,
				}, this.zoom);
				this.updatingMap = false;
			}
		},
	},
});
</script>

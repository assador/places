<template>
	<div id="mapblock" />
</template>

<script>
import axios from 'axios'
import { constants } from '../shared/constants'
import { bus } from '../shared/bus'
import { mapState } from 'vuex'
export default {
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
			map: null,
			mrk: null,
			mrks: {},
			commonMrks: {},
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
			'currentPlaceIndex',
			'placemarksShow',
			'commonPlacemarksShow',
			'centerPlacemarkShow',
		]),
	},
	watch: {
		latitude() {
			this.updatePlacemark(
				this.$root.currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
			if (this.currentPlace) {
				this.$store.dispatch('changeMap', {
					latitude: this.currentPlace.latitude,
					longitude: this.currentPlace.longitude,
				});
			}
		},
		longitude() {
			this.updatePlacemark(
				this.$root.currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
			if (this.currentPlace) {
				this.$store.dispatch('changeMap', {
					latitude: this.currentPlace.latitude,
					longitude: this.currentPlace.longitude,
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
				this.$root.currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
		},
		description() {
			this.updatePlacemark(
				this.$root.currentPlaceCommon
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
		bus.$on('refreshMapMarks', () => {
			this.mrks = {};
			this.map.geoObjects.removeAll();
			this.$store.state.places.forEach((place) => {
				this.appendPlacemark(this.mrks, place, 'private');
			});
			if (this.$parent.currentPlace) {
				if (
					!this.$root.currentPlaceCommon &&
					this.mrks[this.$parent.currentPlace.id]
				) {
					this.mrks[this.$parent.currentPlace.id].setIcon(this.icon_03);
				} else if (this.commonMrks[this.$parent.currentPlace.id]) {
					this.commonMrks[this.$parent.currentPlace.id].setIcon(this.icon_03);
				}
			}
		});
	},
	beforeDestroy() {
		bus.$off('refreshMapMarks');
		if (this.map) {
			this.map.remove();
		}
	},
	methods: {
		showMap(lat, lng, zoom) {
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
				bicycles   = L.tileLayer.provider('CyclOSM')
			;
			const baseMaps = {
				'Спутник'                  : satellite,
				'Топография'               : topography,
				'Топография для туристов'  : tourists,
				'Общественный транспорт'   : transport,
				'Общественный транспорт 2' : aero,
				'Велосипедистам'           : bicycles,
				'Основная карта'           : osm,
			};
			const overlayMaps = {
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
				.bindPopup('Метка центра карты', {autoPan: false})
				.openPopup();
			if (!this.$store.state.centerPlacemarkShow) {
				this.map.removeLayer(this.mrk);
			}
			this.mrk.on('dragend', () => {
				this.map.setView(this.mrk.getLatLng());
			});
			this.$store.state.places.forEach(place => {
				this.appendPlacemark(this.mrks, place, 'private');
			});
			this.$store.state.commonPlaces.forEach(commonPlace => {
				this.appendPlacemark(this.commonMrks, commonPlace, 'common');
			});
			this.$parent.commonPlacesShowHide(this.$store.state.commonPlacemarksShow);
			if (this.currentPlace) {
				if (
					!this.$root.currentPlaceCommon &&
					this.mrks[this.currentPlace.id]
				) {
					this.mrks[this.currentPlace.id].setIcon(this.icon_03);
				} else if (
					this.commonMrks[this.currentPlace.id]
				) {
					this.commonMrks[this.currentPlace.id].setIcon(this.icon_03);
				}
			}
		},
		clickPlacemark(place, type) {
			let marks = (type === 'common' ? this.commonMrks : this.mrks);
			for (let markId in marks) {
				marks[markId].dragging.disable();
			}
			if (type === 'common') {
				marks[place.id].dragging.disable();
			} else {
				marks[place.id].dragging.enable();
			}
			bus.$emit('setCurrentPlace', {place: place});
			if (type === 'common') {
				const inPaginator =
					this.$store.state.commonPlaces.indexOf(place) /
					this.$parent.commonPlacesOnPageCount
				;
				this.$parent.commonPlacesPage = (Number.isInteger(inPaginator)
					? inPaginator + 1
					: Math.ceil(inPaginator)
				);
			}
		},
		appendPlacemark(marks, place, type) {
			let options;
			switch (type) {
				case 'private' :
					options = {icon: this.icon_01, ...this.placemarksOptions.private};
					break;
				case 'common' :
					options = {icon: this.icon_02, ...this.placemarksOptions.common};
					break;
			}
			marks[place.id] = L.marker([place.latitude, place.longitude], options)
				.addTo(this.map)
				.bindPopup(place.name, {autoPan: false})
				.openPopup();
			marks[place.id].on('dragstart', () => {
				if (place !== this.currentPlace) {
					marks[place.id].dragging.disable();
					this.$store.dispatch('setMessage',
						'Для перетаскивания точку сначала нужно выделить.'
					);
				}
			});
			marks[place.id].on('dragend', () => {
				if (place === this.currentPlace) {
					let coordinates = marks[place.id].getLatLng();
					this.$store.dispatch('changePlace', {
						place: place,
						change: {
							latitude: coordinates.lat.toFixed(7),
							longitude: coordinates.lng.toFixed(7),
						},
					});
					bus.$emit('setCurrentPlace', {place: place});
				} else {
					this.clickPlacemark(place, type);
				}
			});
			marks[place.id].on('mouseup', () => {
				this.clickPlacemark(place, type);
			});
		},
		updatePlacemark(marks) {
			if (marks[this.id]) {
				marks[this.id].setLatLng({
					lat: this.latitude,
					lng: this.longitude,
				});
				marks[this.id].title = this.name;
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
}
</script>

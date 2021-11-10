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
			privatePlacemarksColor: 'rgb(100, 44, 36)',
			commonPlacemarksColor: 'rgba(144, 98, 62, 0.6)',
			activePlacemarksColor: 'rgb(217, 82, 0)',
			placemarksOptions: {
				private: {
					visible: true,
					draggable: true,
					preset: 'islands#icon',
					iconColor: 'rgb(100, 44, 36)',
				},
				common: {
					visible: false,
					draggable: false,
					preset: 'islands#icon',
					iconColor: 'rgba(144, 98, 62, 0.6)',
				},
			},
			centerPlacemarkOptions: {
				visible: this.$store.state.centerPlacemarkShow ? true : false,
				draggable: true,
				preset: 'islands#icon',
				iconColor: 'rgb(127, 143, 0)',
			},
			updatingMap: false,
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
					this.mrks[id].options.set(
						'visible', this.geomarksVisibility[id]
					);
				}
			}
		},
		placemarksShow() {
			for (let key in this.mrks) {
				this.mrks[key].options.set('visible', this.$store.state.placemarksShow);
			}
		},
		commonPlacemarksShow() {
			for (let key in this.commonMrks) {
				this.commonMrks[key].options.set('visible', this.$store.state.commonPlacemarksShow);
			}
		},
		centerPlacemarkShow() {
			this.mrk.options.set('visible', this.$store.state.centerPlacemarkShow);
		},
	},
	created() {
		bus.$on('refreshMapYandexMarks', () => {
			this.map.geoObjects.removeAll();
			this.mrks = {};
			this.$store.state.places.forEach(place => {
				this.appendPlacemark(this.mrks, place, 'private');
			});
			if (this.currentPlace) {
				if (
					!this.$root.currentPlaceCommon &&
					this.mrks[this.currentPlace.id]
				) {
					this.mrks[this.currentPlace.id].options.set(
						'iconColor', this.activePlacemarksColor
					);
				} else if (this.commonMrks[this.currentPlace.id]) {
					this.commonMrks[this.currentPlace.id].options.set(
						'iconColor', this.activePlacemarksColor
					);
				}
			}
		});
	},
	mounted() {
		new ResizeSensor(document.getElementById('basic-basic'), () => {
			this.fitMap();
		});
	},
	beforeDestroy() {
		bus.$off('refreshMapMarks');
		if (this.map) {
			this.map.destroy();
		}
	},
	methods: {
		showMap(lat, lng, zoom) {
			ymaps.ready(mapinit.bind(this));
			function mapinit() {
				this.map = new ymaps.Map('mapblock', {
					center: [lat, lng],
					zoom: zoom,
				});
				let coordinates = this.map.getCenter();
				this.$store.dispatch('changeMap', {
					latitude: Number(coordinates[0].toFixed(7)),
					longitude: Number(coordinates[1].toFixed(7)),
					zoom: Number(this.map.getZoom()),
				});
				this.map.controls
					.add(new ymaps.control.RouteButton())
					.add(new ymaps.control.RulerControl());
				this.map.behaviors.enable('scrollZoom');
				this.map.events.add('actionend', () => {
					if (!this.updatingMap) {
						let coordinates = this.map.getCenter();
						this.$store.dispatch('changeMap', {
							latitude: Number(coordinates[0].toFixed(7)),
							longitude: Number(coordinates[1].toFixed(7)),
							zoom: Number(this.map.getZoom()),
						});
						this.mrk.geometry.setCoordinates(coordinates);
					}
				});
				this.mrk = new ymaps.Placemark(
					[lat, lng],
					{
						hintContent: 'Метка центра карты',
						balloonContent: `
							Метка текущих координат центра карты.
							Новое место будет создано здесь.
						`,
					},
					this.centerPlacemarkOptions
				);
				this.mrk.events.add('dragend', () => {
					this.map.setCenter(this.mrk.geometry.getCoordinates());
				});
				this.map.geoObjects.add(this.mrk);
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
						this.mrks[this.currentPlace.id].options.set(
							'iconColor', this.activePlacemarksColor
						);
					} else if (
						this.commonMrks[this.currentPlace.id]
					) {
						this.commonMrks[this.currentPlace.id].options.set(
							'iconColor', this.activePlacemarksColor
						);
					}
				}
			}
		},
		clickPlacemark(place, type) {
			let marks = (type === 'common' ? this.commonMrks : this.mrks);
			for (let markId in marks) {
				marks[markId].options.set('draggable', false);
			}
			marks[place.id].options.set(
				'draggable', (type === 'common' ? false : true)
			);
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
					options = this.placemarksOptions.private;
					break;
				case 'common' :
					options = this.placemarksOptions.common;
					break;
			}
			marks[place.id] = new ymaps.Placemark(
				[place.latitude, place.longitude],
				{
					hintContent: place.name,
					balloonContent: place.description,
				},
				options,
			);
			marks[place.id].events.add('dragstart', () => {
				if (place.id !== this.currentPlace.id) {
					marks[place.id].options.set('draggable', false);
					this.$store.dispatch('setMessage',
						'Для перетаскивания точку сначала нужно выделить.'
					);
				}
			});
			marks[place.id].events.add('dragend', () => {
				if (place.id === this.currentPlace.id) {
					let coordinates = marks[place.id].geometry.getCoordinates();
					this.$store.dispatch('changePlace', {
						place: place,
						change: {
							latitude: Number(coordinates[0].toFixed(7)),
							longitude: Number(coordinates[1].toFixed(7)),
						},
					});
				} else {
					this.clickPlacemark(place, type);
				}
			});
			marks[place.id].events.add('mouseup', () => {
				this.clickPlacemark(place, type);
			});
			this.map.geoObjects.add(marks[place.id]);
		},
		updatePlacemark(marks) {
			if (marks[this.id]) {
				marks[this.id].geometry.setCoordinates([
					this.latitude,
					this.longitude,
				]);
				marks[this.id].properties.set({
					hintContent: this.name,
					balloonContent: this.description,
				});
			}
		},
		updateMap() {
			if (this.map !== null && !this.updatingMap) {
				this.updatingMap = true;
				this.map.setCenter([
					this.centerLatitude,
					this.centerLongitude,
				]);
				this.map.setZoom(
					this.zoom,
					{},
				);
				this.updatingMap = false;
			}
		},
		fitMap() {
			if (this.map !== null) {
				const mapblock = document.getElementById('mapblock');
				mapblock.style.right = '100%';
				this.map.container.fitToViewport();
				if (!this.$parent.compact) {
					mapblock.style.right = '12px';
				} else {
					this.map.container.style.right = '0';
				}
				this.map.container.fitToViewport();
			}
		},
	},
}
</script>

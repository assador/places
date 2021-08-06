<template>
	<div id="mapblock" />
</template>

<script>
import axios from 'axios'
import { constants } from '../shared/constants.ts'
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
		'geomarksVisibility',
	],
	data() {
		return {
			map: null,
			mrk: null,
			mrks: {},
			commonMrks: {},
			placemarksShow: true,
			commonPlacemarksShow: false,
			centerPlacemarkShow: false,
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
				visible: true,
				draggable: true,
				preset: 'islands#icon',
				iconColor: 'rgb(127, 143, 0)',
			},
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
	},
	watch: {
		latitude() {
			this.updatePlacemark(
				this.$root.currentPlaceCommon
					? this.commonMrks
					: this.mrks
			);
			if (this.currentPlace) {
				this.$store.commit('changeCenter', {
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
				this.$store.commit('changeCenter', {
					latitude: this.currentPlace.latitude,
					longitude: this.currentPlace.longitude,
				});
			}
		},
		centerLatitude() {
			this.updateCenter();
		},
		centerLongitude() {
			this.updateCenter();
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
					this.mrks[this.$parent.currentPlace.id].options.set(
						'iconColor', this.activePlacemarksColor
					);
				} else if (this.commonMrks[this.$parent.currentPlace.id]) {
					this.commonMrks[this.$parent.currentPlace.id].options.set(
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
		showMap(lat, lng) {
			ymaps.ready(mapinit.bind(this));
			function mapinit() {
				this.map = new ymaps.Map('mapblock', {
					center: [lat, lng],
					zoom: 15,
				});
				this.map.controls
					.add(new ymaps.control.RouteButton())
					.add(new ymaps.control.RulerControl());
				this.map.behaviors.enable('scrollZoom');
				this.map.events.add('actionend', () => {
					let coordinates = this.map.getCenter();
					this.$store.commit('changeCenter', {
						latitude: coordinates[0].toFixed(7),
						longitude: coordinates[1].toFixed(7),
					});
					this.mrk.geometry.setCoordinates(coordinates);
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
					this.centerPlacemarkOptions,
				);
				this.mrk.options.set('visible', false);
				this.mrk.events.add('dragend', () => {
					this.map.setCenter(this.mrk.geometry.getCoordinates());
				});
				this.map.geoObjects.add(this.mrk);
				this.$store.state.places.forEach((place) => {
					this.appendPlacemark(this.mrks, place, 'private');
				});
				this.$store.state.commonPlaces.forEach((commonPlace) => {
					this.appendPlacemark(this.commonMrks, commonPlace, 'common');
				});
				this.$parent.commonPlacesShowHide(this.$root.currentPlaceCommon);
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
				if (place !== this.currentPlace) {
					marks[place.id].options.set('draggable', false);
					this.$store.dispatch('setMessage',
						'Для перетаскивания точку сначала нужно выделить.'
					);
				}
			});
			marks[place.id].events.add('dragend', () => {
				if (place === this.currentPlace) {
					let coordinates = marks[place.id].geometry.getCoordinates();
					this.$store.commit('changePlace', {
						place: place,
						change: {
							latitude: coordinates[0].toFixed(7),
							longitude: coordinates[1].toFixed(7),
							updated: true,
						},
					});
					bus.$emit('setCurrentPlace', {place: place});
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
		updateCenter() {
			if (this.map !== null) {
				this.map.setCenter([
					this.centerLatitude,
					this.centerLongitude,
				]);
			}
		},
		fitMap() {
			if (this.map !== null) {
				document.getElementById('mapblock').style.right = '100%';
				this.map.container.fitToViewport();
				if (!this.$parent.compact) {
					document.getElementById('mapblock').style.right = '12px';
				} else {
					document.getElementById('mapblock').style.right = '0';
				}
				this.map.container.fitToViewport();
			}
		},
		placemarksShowHide(show = null) {
			for (let key in this.mrks) {
				if (this.placemarksShow) {
					this.mrks[key].options.set('visible', false);
				} else {
					this.mrks[key].options.set('visible', true);
				}
			}
			this.placemarksShow =
				show === null
					? !this.placemarksShow
					: show
			;
			if (!this.placemarksShow) {
				document.getElementById('placemarksShowHideButton').classList.remove('button-pressed');
			} else {
				document.getElementById('placemarksShowHideButton').classList.add('button-pressed');
			}
		},
		commonPlacemarksShowHide(show = null) {
			for (let key in this.commonMrks) {
				if (this.commonPlacemarksShow) {
					this.commonMrks[key].options.set('visible', false);
				} else {
					this.commonMrks[key].options.set('visible', true);
				}
			}
			this.commonPlacemarksShow =
				show === null
					? !this.commonPlacemarksShow
					: show
			;
		},
		centerPlacemarkShowHide(show = null) {
			if (this.centerPlacemarkShow) {
				this.mrk.options.set('visible', false);
			} else {
				this.mrk.options.set('visible', true);
			}
			this.centerPlacemarkShow =
				show === null
					? !this.centerPlacemarkShow
					: show
			;
		},
	},
}
</script>

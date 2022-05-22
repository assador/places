<template>
	<div id="mapblock" />
</template>

<script lang="ts">
import Vue from 'vue';
import { bus } from '../shared/bus';
import ymaps from 'ymaps';
import { Map, Placemark } from 'yandex-maps';
import { ResizeSensor } from 'css-element-queries'
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
			maps: null as unknown as any,
			map: null as unknown as Map,
			mrk: null as unknown as Placemark,
			mrks: {} as Record<string, Placemark>,
			commonMrks: {} as Record<string, Placemark>,
			privatePlacemarksColor: 'rgb(100, 44, 36)' as string,
			commonPlacemarksColor: 'rgba(144, 98, 62, 0.6)' as string,
			activePlacemarksColor: 'rgb(217, 82, 0)' as string,
			placemarksOptions: {
				private: {
					visible: true as boolean,
					draggable: true as boolean,
					preset: 'islands#icon',
					iconColor: 'rgb(100, 44, 36)',
				},
				common: {
					visible: false as boolean,
					draggable: false as boolean,
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
					this.mrks[id].options.set({
						visible: this.geomarksVisibility[id],
					});
				}
			}
		},
		placemarksShow() {
			for (let key in this.mrks) {
				this.mrks[key].options.set({
					visible: this.$store.state.placemarksShow,
				});
			}
		},
		commonPlacemarksShow() {
			for (let key in this.commonMrks) {
				this.commonMrks[key].options.set({
					visible: this.$store.state.commonPlacemarksShow,
				});
			}
		},
		centerPlacemarkShow() {
			this.mrk.options.set({
				visible: this.$store.state.centerPlacemarkShow,
			});
		},
	},
	created() {
		bus.$on('refreshMapYandexMarks', () => {
			this.map.geoObjects.removeAll();
			this.mrks = {};
			for (const id in this.$store.state.places) {
				this.appendPlacemark(this.mrks, this.$store.state.places[id], 'private');
			}
			if (this.currentPlace) {
				if (
					!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
					this.mrks[this.currentPlace.id]
				) {
					this.mrks[this.currentPlace.id].options.set({
						iconColor: this.activePlacemarksColor,
					});
				} else if (this.commonMrks[this.currentPlace.id]) {
					this.commonMrks[this.currentPlace.id].options.set({
						iconColor: this.activePlacemarksColor,
					});
				}
			}
		});
	},
	mounted() {
		new ResizeSensor(document.getElementById('basic-basic') as HTMLElement, () => {
			this.fitMap();
		});
	},
	beforeDestroy() {
		bus.$off('refreshMapYandexMarks');
		if (this.map) {
			this.map.destroy();
		}
	},
	methods: {
		showMap(lat: number, lng: number, zoom: number) {
			ymaps.load('https://api-maps.yandex.ru/2.1/?lang=ru_RU').then((maps: any) => {
				this.maps = maps;
				this.map = new maps.Map('mapblock', {
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
					.add(new this.maps.control.RouteButton())
					.add(new this.maps.control.RulerControl());
				this.map.behaviors.enable('scrollZoom');
				this.map.events.add('actionend', () => {
					if (!this.updatingMap) {
						let coordinates = this.map.getCenter();
						this.$store.dispatch('changeMap', {
							latitude: Number(coordinates[0].toFixed(7)),
							longitude: Number(coordinates[1].toFixed(7)),
							zoom: Number(this.map.getZoom()),
						});
						this.mrk.geometry!.setCoordinates(coordinates);
					}
				});
				this.mrk = new this.maps.Placemark(
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
					this.map.setCenter(this.mrk.geometry!.getCoordinates() as number[]);
				});
				this.map.geoObjects.add(this.mrk);
				for (const id in this.$store.state.places) {
					this.appendPlacemark(this.mrks, this.$store.state.places[id], 'private');
				}
				for (const id in this.$store.state.commonPlaces) {
					this.appendPlacemark(this.commonMrks, this.$store.state.commonPlaces[id], 'common');
				}
				(this.$parent as Vue & {commonPlacesShowHide(show: boolean): void}).commonPlacesShowHide(
					this.$store.state.commonPlacemarksShow
				);
				if (this.currentPlace) {
					if (
						!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
						this.mrks[this.currentPlace.id]
					) {
						this.mrks[this.currentPlace.id].options.set({
							iconColor: this.activePlacemarksColor,
						});
					} else if (
						this.commonMrks[this.currentPlace.id]
					) {
						this.commonMrks[this.currentPlace.id].options.set({
							iconColor: this.activePlacemarksColor,
						});
					}
				}
			});
		},
		clickPlacemark(place: Place, type: string) {
			let marks: Record<string, Placemark> = (type === 'common' ? this.commonMrks : this.mrks);
			marks[place.id].options.set({
				draggable: (type === 'common' ? false : true),
			});
			bus.$emit('setCurrentPlace', {place: place});
			if (type === 'common') {
				const inPaginator =
					Object.keys(this.$store.state.commonPlaces).indexOf(place.id) /
					(this.$parent as Vue & {commonPlacesOnPageCount: number}).commonPlacesOnPageCount;
				(this.$parent as Vue & {commonPlacesPage: number}).commonPlacesPage =
					(Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
					);
			}
		},
		appendPlacemark(marks: Record<string, Placemark>, place: Place, type: string) {
			let options;
			switch (type) {
				case 'private' :
					options = this.placemarksOptions.private;
					break;
				case 'common' :
					options = this.placemarksOptions.common;
					break;
			}
			marks[place.id] = new this.maps.Placemark(
				[
					this.$store.state.waypoints[place.waypoint].latitude,
					this.$store.state.waypoints[place.waypoint].longitude,
				],
				{
					hintContent: place.name,
					balloonContent: place.description,
				},
				options,
			);
			marks[place.id].events.add('dragstart', () => {
				if (place.id !== this.currentPlace.id) {
					marks[place.id].options.set({draggable: false});
					this.$store.dispatch('setMessage',
						'Для перетаскивания точку сначала нужно выделить.'
					);
				}
			});
			marks[place.id].events.add('dragend', () => {
				if (place.id === this.currentPlace.id) {
					let coordinates = marks[place.id].geometry!.getCoordinates();
					this.$store.dispatch('changePlace', {
						place: place,
						change: {
							latitude: Number(coordinates![0].toFixed(7)),
							longitude: Number(coordinates![1].toFixed(7)),
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
		updatePlacemark(marks: Record<string, Placemark>) {
			if (marks[this.id]) {
				marks[this.id].geometry!.setCoordinates([
					this.latitude,
					this.longitude,
				]);
				marks[this.id].properties.set('hintContent', this.name);
				marks[this.id].properties.set('balloonContent', this.description);
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
				const mapblock = document.getElementById('mapblock') as HTMLElement;
				mapblock.style.right = '100%';
				this.map.container.fitToViewport();
				if (!(this.$parent as Vue & {compact: boolean}).compact) {
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

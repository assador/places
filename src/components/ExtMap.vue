<template>
	<div id="mapblock"></div>
</template>

<script>
import axios from "axios"
import {constants} from "../shared/constants.js"
import {bus} from "../shared/bus.js"
export default {
	props: ["id", "name", "description", "images", "latitude", "longitude", "centerLatitude", "centerLongitude"],
	data: function() {return {
		map: null,
		mrk: null,
		mrks: {},
		commonMrks: {},
		placemarksShow: true,
		commonPlacemarksShow: false,
		centerPlacemarkShow: false,
		privatePlacemarksColor: "rgb(100, 44, 36)",
		commonPlacemarksColor: "rgba(144, 98, 62, 0.6)",
		activePlacemarksColor: "rgb(217, 82, 0)",
		placemarksOptions: {
			private: {
				visible: true,
				draggable: true,
				preset: "islands#icon",
				iconColor: "rgb(100, 44, 36)",
			},
			common: {
				visible: false,
				draggable: false,
				preset: "islands#icon",
				iconColor: "rgba(144, 98, 62, 0.6)",
			},
		},
		centerPlacemarkOptions: {
			visible: true,
			draggable: true,
			preset: "islands#icon",
			iconColor: "rgb(127, 143, 0)",
		},
	}},
	mounted: function() {
		new ResizeSensor(document.getElementById("basic-basic"), () => {
			this.fitMap();
		});
	},
	beforeDestroy: function() {
		if(this.map) {
			this.map.destroy();
		}
	},
	watch: {
		latitude: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
			if(this.$store.state.currentPlace) {
				this.$store.commit("changeCenter", {
					latitude: this.$store.state.currentPlace.latitude,
					longitude: this.$store.state.currentPlace.longitude,
				});
			}
		},
		longitude: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
			if(this.$store.state.currentPlace) {
				this.$store.commit("changeCenter", {
					latitude: this.$store.state.currentPlace.latitude,
					longitude: this.$store.state.currentPlace.longitude,
				});
			}
		},
		centerLatitude: function() {
			this.updateCenter();
		},
		centerLongitude: function() {
			this.updateCenter();
		},
		name: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
		},
		description: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
		},
	},
	computed: {
		showMap: (lat, lng) => function(lat, lng) {
			ymaps.ready(mapinit.bind(this));
			function mapinit() {
				this.map = new ymaps.Map("mapblock", {
					center: [lat, lng],
					zoom: 15,
				});
				this.map.controls
					.add(new ymaps.control.RouteButton())
					.add(new ymaps.control.RulerControl());
				this.map.behaviors.enable("scrollZoom");
				this.map.events.add("actionend", () => {
					let coordinates = this.map.getCenter();
					this.$store.commit("changeCenter", {
						latitude: coordinates[0].toFixed(7),
						longitude: coordinates[1].toFixed(7),
					});
					this.mrk.geometry.setCoordinates(coordinates);
				});
				this.mrk = new ymaps.Placemark(
					[lat, lng],
					{hintContent: "Метка центра карты", balloonContent: "Метка текущих координат центра карты. Новое место будет создано здесь."},
					this.centerPlacemarkOptions,
				);
				this.mrk.options.set("visible", false);
				this.mrk.events.add("dragend", () => {
					this.map.setCenter(this.mrk.geometry.getCoordinates());
				});
				this.map.geoObjects.add(this.mrk);
				this.$store.state.places.forEach((place) => {
					this.appendPlacemark(this.mrks, place, "private");
				});
				this.$store.state.commonPlaces.forEach((commonPlace) => {
					this.appendPlacemark(this.commonMrks, commonPlace, "common");
				});
				this.$parent.commonPlacesShowHide(this.$parent.currentPlaceCommon);
				if(this.$store.state.currentPlace) {
					if(
						!this.$parent.currentPlaceCommon
						&& this.mrks[this.$store.state.currentPlace.id]
					) {
						this.mrks[this.$store.state.currentPlace.id].options.set(
							"iconColor", this.activePlacemarksColor
						);
					} else if(
						this.commonMrks[this.$store.state.currentPlace.id]
					) {
						this.commonMrks[this.$store.state.currentPlace.id].options.set(
							"iconColor", this.activePlacemarksColor
						);
					}
				}
			};
		},
		clickPlacemark: (place, type) => function(place, type) {
			let marks = type === "common" ? this.commonMrks : this.mrks;
			for(let i = 0; i < marks.length; i++) {
				marks[i].options.set("draggable", false);
			}
			marks[place.id].options.set("draggable", true);
			this.$parent.setCurrentPlace(place, type === "common" ? true : false);
		},
		appendPlacemark: (marks, place, type) => function(marks, place, type) {
			let options;
			switch(type) {
				case "private" :
					options = this.placemarksOptions.private;
					break;
				case "common" :
					options = this.placemarksOptions.common;
					break;
			}
			marks[place.id] = new ymaps.Placemark(
				[place.latitude, place.longitude],
				{hintContent: place.name, balloonContent: place.description},
				options,
			);
			marks[place.id].events.add("dragstart", () => {
				if(place !== this.$store.state.currentPlace) {
					marks[place.id].options.set("draggable", false);
					this.$store.dispatch("setMessage", "Для перетаскивания точку сначала нужно выделить");
				}
			});
			marks[place.id].events.add("dragend", () => {
				if(place === this.$store.state.currentPlace) {
					let coordinates = marks[place.id].geometry.getCoordinates();
					this.$store.commit("changePlace", {
						place: place,
						change: {
							latitude: coordinates[0].toFixed(7),
							longitude: coordinates[1].toFixed(7),
							updated: true,
						},
					});
					this.$parent.setCurrentPlace(place, type === "common" ? true : false);
				} else {
					this.clickPlacemark(place, type);
				}
			});
			marks[place.id].events.add("mouseup", () => {
				this.clickPlacemark(place, type);
			});
			this.map.geoObjects.add(marks[place.id]);
		},
		updatePlacemark: (marks) => function(marks) {
			if(marks[this.id]) {
				marks[this.id].geometry.setCoordinates([this.latitude, this.longitude]);
				marks[this.id].properties.set({hintContent: this.name, balloonContent: this.description});
			}
		},
		updateCenter: () => function() {
			if(this.map !== null) {
				this.map.setCenter([this.centerLatitude, this.centerLongitude]);
			}
		},
		fitMap: () => function() {
			if(this.map !== null) {
				document.getElementById("mapblock").style.right = "100%";
				this.map.container.fitToViewport();
				if(!this.$parent.compact) {
					document.getElementById("mapblock").style.right = "12px";
				} else {
					document.getElementById("mapblock").style.right = "0";
				}
				this.map.container.fitToViewport();
			}
		},
		placemarksShowHide: (show = null) => function(show = null) {
			for(let key in this.mrks) {
				if(this.placemarksShow) {
					this.mrks[key].options.set("visible", false);
				} else {
					this.mrks[key].options.set("visible", true);
				}
			}
			this.placemarksShow =
				show === null
					? !this.placemarksShow
					: show
			;
			if(!this.placemarksShow) {
				document.getElementById("placemarksShowHideButton").classList.remove("button-pressed");
			} else {
				document.getElementById("placemarksShowHideButton").classList.add("button-pressed");
			}
		},
		commonPlacemarksShowHide: (show = null) => function(show = null) {
			for(let key in this.commonMrks) {
				if(this.commonPlacemarksShow) {
					this.commonMrks[key].options.set("visible", false);
				} else {
					this.commonMrks[key].options.set("visible", true);
				}
			}
			this.commonPlacemarksShow =
				show === null
					? !this.commonPlacemarksShow
					: show
			;
			if(!this.commonPlacemarksShow) {
				document.getElementById("commonPlacemarksShowHideButton").classList.remove("button-pressed");
			} else {
				document.getElementById("commonPlacemarksShowHideButton").classList.add("button-pressed");
			}
		},
		centerPlacemarkShowHide: (show = null) => function(show = null) {
			if(this.centerPlacemarkShow) {
				this.mrk.options.set("visible", false);
				document.getElementById("centerPlacemarkShowHideButton").classList.remove("button-pressed");
			} else {
				this.mrk.options.set("visible", true);
				document.getElementById("centerPlacemarkShowHideButton").classList.add("button-pressed");
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

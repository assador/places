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
	watch: {
		latitude: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
			if(Object.keys(this.$store.state.currentPlace).length > 0) {
				this.$store.commit("changeCenter", {
					latitude: this.$store.state.currentPlace.latitude,
					longitude: this.$store.state.currentPlace.longitude,
				});
			}
		},
		longitude: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
			if(Object.keys(this.$store.state.currentPlace).length > 0) {
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
				if(this.$store.state.places.length > 0) {
					if(this.$store.state.currentPlaceIndex > -1) {
						bus.$emit("setCurrentPlace", {
							place: this.$store.state.currentPlace,
							common: this.$parent.currentPlaceCommon,
						});
						// No matter how idiotic it looks
					} else if(Object.keys(this.$store.state.homePlace)) {
						bus.$emit("setCurrentPlace", {
							place: this.$store.state.homePlace,
						});
					} else {
						let firstPlaceInRoot = this.$store.state.places.find(
							p => p.folderid === null
						);
						if(!firstPlaceInRoot) {
							bus.$emit("setCurrentPlace", {
								place: this.$store.state.places[0],
							});
						} else {
							bus.$emit("setCurrentPlace", {
								place: firstPlaceInRoot,
							});
						}
					}
					this.$store.commit("backupState");
				}
			};
		},
		clickPlacemark: (place, type) => function(place, type) {
			for(let i = 0; i < this.mrks.length; i++) {
				this.mrks[i].options.set("draggable", false);
			}
			this.mrks[place.id].options.set("draggable", true);
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
		appendPlace: () => function() {
			let data = new FormData();
			data.append("userid", this.$store.state.user.id);
			data.append("need", "visiting");
			axios.post("/backend/get_groups.php", data)
				.then(response => {
					if(
						constants.rights.placescounts[response.data] < 0
						|| constants.rights.placescounts[response.data] > this.$store.state.places.length
						|| this.$store.state.user.testaccount
					) {
						let newPlace = {
							type: "place",
							userid: sessionStorage.getItem("places-userid"),
							name: "",
							description: "",
							latitude: this.map.getCenter()[0].toFixed(7),
							longitude: this.map.getCenter()[1].toFixed(7),
							altitudecapability: null,
							time: new Date().toISOString().slice(0, -5),
							id: generateRandomString(32),
							folderid:
								Object.keys(this.$store.state.currentPlace).length > 0
									? this.$store.state.currentPlace.folderid
									: "root"
							,
							srt:
								this.$store.state.places.length > 0
									? Math.ceil(Math.max(
										...this.$store.state.places.map(
											function(place) {
												return place.srt;
											}
										)
									)) + 1
									: 1
							,
							common: false,
							images: [],
							added: true,
							deleted: false,
							updated: false,
							show: true,
						};
						this.$store.commit("addPlace", newPlace);
						this.appendPlacemark(this.mrks, newPlace, "private");
						this.$parent.setCurrentPlace(
							this.$store.state.places[
								this.$store.state.places.length - 1
							]
						);
						return newPlace;
					} else {
						this.$store.dispatch("setMessage",
							'Превышено максимально допустимое для вашей ' +
							'текущей роли количство мест<br />Дождитесь ' +
							'перехода в следующую роль, или обратитесь ' +
							'к администрации сервиса по адресу<br />' +
							'<a href="mailto:' + constants.from +
							'">' + constants.from + '</a>'
						);
					}
				});
		},
		placemarksShowHide: () => function() {
			for(let key in this.mrks) {
				if(this.placemarksShow) {
					this.mrks[key].options.set("visible", false);
				} else {
					this.mrks[key].options.set("visible", true);
				}
			}
			this.placemarksShow = !this.placemarksShow;
			if(!this.placemarksShow) {
				document.getElementById("placemarksShowHideButton").classList.remove("button-pressed");
			} else {
				document.getElementById("placemarksShowHideButton").classList.add("button-pressed");
			}
		},
		commonPlacemarksShowHide: () => function() {
			for(let key in this.commonMrks) {
				if(this.commonPlacemarksShow) {
					this.commonMrks[key].options.set("visible", false);
				} else {
					this.commonMrks[key].options.set("visible", true);
				}
			}
			this.commonPlacemarksShow = !this.commonPlacemarksShow;
			if(!this.commonPlacemarksShow) {
				document.getElementById("commonPlacemarksShowHideButton").classList.remove("button-pressed");
			} else {
				document.getElementById("commonPlacemarksShowHideButton").classList.add("button-pressed");
			}
		},
		centerPlacemarkShowHide: () => function() {
			if(this.centerPlacemarkShow) {
				this.mrk.options.set("visible", false);
				document.getElementById("centerPlacemarkShowHideButton").classList.remove("button-pressed");
			} else {
				this.mrk.options.set("visible", true);
				document.getElementById("centerPlacemarkShowHideButton").classList.add("button-pressed");
			}
			this.centerPlacemarkShow = !this.centerPlacemarkShow;
		},
	},
}
</script>

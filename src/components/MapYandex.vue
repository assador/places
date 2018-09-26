<template>
	<div id="mapblock" class="margin_bottom"></div>
</template>

<script>
export default {
	props: ["id", "name", "description", "images", "latitude", "longitude", "centerLatitude", "centerLongitude"],
	data() {return {
		map: null,
		mrk: null,
		mrks: {},
		commonMrks: {},
		placemarksShow: true,
		commonPlacemarksShow: false,
		centerPlacemarkShow: false,
		activePlacemarkId: "",
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
			iconColor: "rgb(217, 82, 0)",
		},
	}},
	watch: {
		latitude: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
		},
		longitude: function() {
			this.updatePlacemark(this.$parent.currentPlaceCommon ? this.commonMrks : this.mrks);
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
				this.map.events.add("actionend", function() {
					let coordinates = this.map.getCenter();
					this.$store.commit("changeCenter", {
						latitude: coordinates[0].toFixed(7),
						longitude: coordinates[1].toFixed(7),
					});
					this.mrk.geometry.setCoordinates(coordinates);
				}.bind(this));
				this.mrk = new ymaps.Placemark(
					[lat, lng],
					{hintContent: "Метка центра карты", balloonContent: "Метка текущих координат центра карты. Новое место будет создано здесь."},
					this.centerPlacemarkOptions,
				);
				this.mrk.options.set("visible", false);
				this.mrk.events.add("dragend", function() {
					this.map.setCenter(this.mrk.geometry.getCoordinates());
				}.bind(this));
				this.map.geoObjects.add(this.mrk);
				this.$store.state.places.forEach(function(place) {
					this.appendPlacemark(this.mrks, place, "private");
				}.bind(this));
				this.$store.state.commonPlaces.forEach(function(commonPlace) {
					this.appendPlacemark(this.commonMrks, commonPlace, "common");
				}.bind(this));
			};
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
			marks[place.id].events.add("dragend", function() {
				let coordinates = marks[place.id].geometry.getCoordinates();
				this.$store.commit("changePlace", {
					index: this.$store.state.places.indexOf(place),
					change: {
						latitude: coordinates[0].toFixed(7),
						longitude: coordinates[1].toFixed(7),
					},
				});
			}.bind(this));
			this.map.geoObjects.add(marks[place.id]);
		},
		updatePlacemark: (marks) => function(marks) {
			marks[this.id].geometry.setCoordinates([this.latitude, this.longitude]);
			marks[this.id].properties.set({hintContent: this.name, balloonContent: this.description});
		},
		updateCenterPlacemark: () => function() {
			this.map.setCenter([this.latitude, this.longitude]);
			this.mrk.geometry.setCoordinates([this.latitude, this.longitude]);
		},
		updateCenter: () => function() {
			this.map.setCenter([this.centerLatitude, this.centerLongitude]);
		},
		fitMap: () => function() {
			if(this.map) {
				document.getElementById("mapblock").style.right = "100%";
				this.map.container.fitToViewport();
				document.getElementById("mapblock").style.right = "24px";
				this.map.container.fitToViewport();
			}
		},
		appendPlace: () => function() {
			let newName = "Новое место";
			let newDescription = newName + ", добавленное в «Местах».";
			let newPlace = {
				userid: localStorage.getItem("places-userid"),
				name: newName,
				description: newDescription,
				latitude: this.map.getCenter()[0].toFixed(7),
				longitude: this.map.getCenter()[1].toFixed(7),
				id: generateRandomString(32),
				srt: this.$store.state.places.length > 0
					? Math.ceil(Math.max(
						...this.$store.state.places.map(function(place) {
							return place.srt;
						})
					)) + 1
					: 1,
				common: false,
				images: [],
				added: true,
				deleted: false,
				updated: false,
				show: true,
			};
			this.$store.commit("addPlace", newPlace);
			this.appendPlacemark(this.mrks, newPlace, "private");
			this.$parent.setCurrentPlace(this.$store.state.places.length - 1);
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
	mounted: function() {
		new ResizeSensor(document.getElementById("basic-basic"), function() {
			this.fitMap();
		}.bind(this));
	},
}
</script>

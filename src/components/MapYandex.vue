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
		placemarksShown: true,
		centerPlacemarkShown: false,
	}},
	watch: {
		latitude: function() {
			this.updatePlacemark();
		},
		longitude: function() {
			this.updatePlacemark();
		},
		centerLatitude: function() {
			this.updateCenter();
		},
		centerLongitude: function() {
			this.updateCenter();
		},
		name: function() {
			this.updatePlacemark();
		},
		description: function() {
			this.updatePlacemark();
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
				this.map.controls.add(new ymaps.control.MapTools());
				this.map.controls.add(new ymaps.control.RouteEditor());
				this.map.controls.add(new ymaps.control.TypeSelector(["yandex#map", "yandex#satellite", "yandex#hybrid"]));
				this.map.controls.add(new ymaps.control.ZoomControl());
				this.map.controls.add("scaleLine");
				this.map.controls.add(new ymaps.control.TrafficControl({providerKey: "traffic#archive"}));
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
					{draggable: true},
				);
				this.mrk.options.set("visible", false);
				this.mrk.events.add("dragend", function() {
					this.map.setCenter(this.mrk.geometry.getCoordinates());
				}.bind(this));
				this.map.geoObjects.add(this.mrk);
				this.$store.state.places.forEach(function(place) {
					this.appendPlacemark(place);
				}.bind(this));
			};
		},
		appendPlacemark: (place) => function(place) {
			this.mrks[place.id] = new ymaps.Placemark(
				[place.latitude, place.longitude],
				{hintContent: place.name, balloonContent: place.description},
				{draggable: true},
			);
			this.mrks[place.id].events.add("dragend", function() {
				let coordinates = this.mrks[place.id].geometry.getCoordinates();
				this.$store.commit("changePlace", {
					index: this.$store.state.places.indexOf(place),
					change: {
						latitude: coordinates[0].toFixed(7),
						longitude: coordinates[1].toFixed(7),
					},
				});
			}.bind(this));
			this.map.geoObjects.add(this.mrks[place.id]);
		},
		updatePlacemark: () => function() {
			this.mrks[this.id].geometry.setCoordinates([this.latitude, this.longitude]);
			this.mrks[this.id].properties.set({hintContent: this.name, balloonContent: this.description});
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
				userid: localStorage.getItem("user-id"),
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
				images: [],
				added: true,
				deleted: false,
				updated: false,
				show: true,
			};
			this.$store.commit("addPlace", newPlace);
			this.appendPlacemark(newPlace);
			this.$parent.setCurrentPlace(this.$store.state.places.length - 1);
		},
		placemarksShowHide: () => function() {
			for(let key in this.mrks) {
				if(this.placemarksShown) {
					this.mrks[key].options.set("visible", false);
					document.getElementById("placemarksShowHideButton").classList.remove("button-pressed");
				} else {
					this.mrks[key].options.set("visible", true);
					document.getElementById("placemarksShowHideButton").classList.add("button-pressed");
				}
			}
			this.placemarksShown = !this.placemarksShown;
		},
		centerPlacemarkShowHide: () => function() {
			if(this.centerPlacemarkShown) {
				this.mrk.options.set("visible", false);
				document.getElementById("centerPlacemarkShowHideButton").classList.remove("button-pressed");
			} else {
				this.mrk.options.set("visible", true);
				document.getElementById("centerPlacemarkShowHideButton").classList.add("button-pressed");
			}
			this.centerPlacemarkShown = !this.centerPlacemarkShown;
		},
	},
	mounted: function() {
		new ResizeSensor(document.getElementById("basic-basic"), function() {
			this.fitMap();
		}.bind(this));
	},
}
</script>

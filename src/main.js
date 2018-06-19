import Vue from 'vue'
import Vuex from 'vuex'
import App from './components/App.vue'
import { store } from './store.js'

Vue.use(Vuex);

Vue.component('mapyandex', {
	props: ['id', 'name', 'description', 'image', 'latitude', 'longitude', 'centerLatitude', 'centerLongitude'],
	data() {return {
		map: null,
		mrk: null,
	}},
	watch: {
		id: function() {
			this.updatePlacemark();
		},
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
		image: function() {
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
				this.map.events.add("actionend", function() {
					var coordinates = this.map.getCenter();
					this.$store.commit("changeCenter", {
						latitude: coordinates[0].toFixed(7),
						longitude: coordinates[1].toFixed(7),
					});
					if(this.$store.state.places.length == 0) {
						this.mrk.geometry.setCoordinates(this.map.getCenter());
					}
				}.bind(this));
				this.mrk = new ymaps.Placemark(
					[lat, lng],
					{
						hintContent: "",
						balloonContent: "",
					},
					{
						draggable: true,
					},
				);
				this.mrk.events.add("dragend", function() {
					var coordinates = this.mrk.geometry.getCoordinates();
					if(!this.$store.state.empty) {
						this.$store.commit("changePlace", {
							index: this.mrk.placeIndex,
							change: {
								latitude: coordinates[0].toFixed(7),
								longitude: coordinates[1].toFixed(7),
							},
						});
					} else {
						this.map.setCenter(coordinates);
					}
				}.bind(this));
				this.map.geoObjects.add(this.mrk);
			};
		},
		updatePlacemark: () => function() {
			this.map.setCenter([this.latitude, this.longitude]);
			this.mrk.geometry.setCoordinates([this.latitude, this.longitude]);
			this.mrk.properties.set("hintContent", this.name);
			this.mrk.properties.set("balloonContent", this.description);
		},
		updateCenter: () => function() {
			this.map.setCenter([this.centerLatitude, this.centerLongitude]);
		},
		fitMap: () => function() {
			document.getElementById("mapblock").style.right = "100%";
			this.map.container.fitToViewport();
			document.getElementById("mapblock").style.right = "24px";
			this.map.container.fitToViewport();
		},
		appendPlace: () => function() {
			let newId = "place_" + (this.$store.state.places.length + 1);
			let newName = "Новое место (ID: " + newId + ")";
			let newDescription = newName + ", добавленное в “The Places”.";
			this.$store.commit("addPlace", {
				srt: this.$store.state.places.length > 0
					? Math.ceil(Math.max(
						...this.$store.state.places.map(function(place) {
							return place.srt;
						})
					)) + 1
					: 1,
				id: newId,
				name: newName,
				description: newDescription,
				latitude: this.map.getCenter()[0].toFixed(7),
				longitude: this.map.getCenter()[1].toFixed(7),
				image: "",
			});
			setTimeout(function() {
				this.$parent.setCurrentPlace(this.$store.state.places.length - 1)
			}.bind(this), 50);
		},
	},
	mounted: function() {
		new ResizeSensor(document.getElementById("basic-basic"), function() {
			this.fitMap();
		}.bind(this));
	},
	template: `
		<div id="mapblock" class="margin_bottom"></div>
	`,
});

let app = new Vue({
	store,
	el: '#app',
	render: h => h(App),
	mounted: function() {
		store.dispatch('setPlaces');
	},
});
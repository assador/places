import Vue from 'vue'
import Vuex from 'vuex'
import App from './components/App.vue'
import { store } from './store.js'

Vue.use(Vuex);

Vue.component('yandexmap', {
	props: ['id', 'name', 'description', 'latitude', 'longitude', 'image'],
	data() {return {
		map: null,
		mrk: null,
		sfm: null,
	}},
	watch: {
		id: function() {
			this.updatePlacemark();
			this.$store.commit("changePlace", {
				index: this.mrk.placeIndex,
				change: {
					id: this.id,
				},
			});
		},
		latitude: function() {
			this.updatePlacemark();
			this.$store.commit("changePlace", {
				index: this.mrk.placeIndex,
				change: {
					latitude: this.mrk.geometry.getCoordinates()[0],
				},
			});
		},
		longitude: function() {
			this.updatePlacemark();
			this.$store.commit("changePlace", {
				index: this.mrk.placeIndex,
				change: {
					longitude: this.mrk.geometry.getCoordinates()[1],
				},
			});
		},
		name: function() {
			this.updatePlacemark();
			this.$store.commit("changePlace", {
				index: this.mrk.placeIndex,
				change: {
					name: this.name,
				},
			});
		},
		description: function() {
			this.updatePlacemark();
			this.$store.commit("changePlace", {
				index: this.mrk.placeIndex,
				change: {
					description: this.description,
				},
			});
		},
		image: function() {
			this.updatePlacemark();
			this.$store.commit("changePlace", {
				index: this.mrk.placeIndex,
				change: {
					image: this.image,
				},
			});
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
				this.sfm = new ymaps.control.Button({data: {
					content: "Добавить метку",
					title: "Добавить метку в центре карты",
				}});
				this.sfm.events.add("click", function() {
					var newId = "place_" + (this.$store.state.places.length + 1);
					var newName = "Новое место (ID: " + newId + ")";
					var newDescription = newName + ", добавленное в Geo Store.";
					this.$store.commit("addPlace", {
						id: newId,
						name: newName,
						description: newDescription,
						latitude: this.map.getCenter()[0],
						longitude: this.map.getCenter()[1],
						image: "",
					});
					setTimeout(function() {
						this.$parent.setCurrentPlace(this.$store.state.places.length - 1)
					}.bind(this), 50);
				}.bind(this));
				this.map.controls.add(this.sfm, {top: 5, left: 140});
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
					this.$store.commit("changePlace", {
						index: this.mrk.placeIndex,
						change: {
							latitude: coordinates[0],
							longitude: coordinates[1],
						},
					});
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
	},
	mounted: function() {
		window.addEventListener("resize", function() {
			document.getElementById("mapblock").style.right = "100%";
			this.map.container.fitToViewport();
			document.getElementById("mapblock").style.right = "24px";
			this.map.container.fitToViewport();
		}.bind(this), false);
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

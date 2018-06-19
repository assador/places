export const store = new Vuex.Store({
	state: {
		places: [],
		center: {},
		empty: true,
		ready: false,
		placeFields: {
			"srt"         : "Сортировка",
			"id"          : "Идентификатор метки",
			"name"        : "Название",
			"description" : "Описание",
			"latitude"    : "Широта",
			"longitude"   : "Долгота",
			"image"       : "Фотография",
		},
	},
	mutations: {
		placesReady(state, places, empty) {
			Vue.set(state, "places", places);
			Vue.set(state, "empty", empty);
			Vue.set(state, "ready", true);
		},
		modifyPlaces(state, places) {
			Vue.set(state, "places", places);
		},
		addPlace(state, place) {
			Vue.set(state, "places", state.places.concat(place));
			Vue.set(state, "empty", false);
		},
		removePlace(state, index) {
			state.places.splice(index, 1);
			if(state.places.length == 0) {
				Vue.set(state, "empty", true);
			}
		},
		changePlace(state, changes) {
			let place = state.places[changes.index];
			let keys = Object.keys(changes.change);
			for(var i = 0; i < keys.length; i++) {
				place[keys[i]] = changes.change[keys[i]];
			}
		},
		swapPlacesValues(state, changes) {
			let p1 = state.places[changes.indexes[0]];
			let p2 = state.places[changes.indexes[1]];
			changes.values.forEach(function(key) {
				p1[key] = [p2[key], p2[key] = p1[key]][0];
			});
		},
		changeCenter(state, center) {
			Vue.set(state, "center", center);
		},
	},
	actions: {
		setPlaces({ commit }) {
			let placesRequest = new XMLHttpRequest();
			placesRequest.open("GET", "/json/places.json", true);
			placesRequest.onreadystatechange = function(event) {
				if(placesRequest.readyState == 4) {
					if(placesRequest.status == 200) {
						commit("placesReady", JSON.parse(placesRequest.responseText), false);
					} else {
						console.log("Не могу скачать /json/places.json");
						commit("placesReady", [], true);
					}
				}
			};
			placesRequest.send(null);
		},
	},
	getters: {
		getPlace: (state, getters) => (index) => {
			return state.places[index];
		},
		getIndexById: (state, getters) => (id) => {
			return state.places.indexOf(state.places.find(p => p.id === id));
		},
	},
});

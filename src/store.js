export const store = new Vuex.Store({
	state: {
		places: [],
		center: {},
		empty: true,
		ready: false,
	},
	mutations: {
		placesReady(state, places) {
			Vue.set(state, "places", places);
			Vue.set(state, "empty", true);
			Vue.set(state, "ready", true);
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

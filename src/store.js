export const store = new Vuex.Store({
	state: {
		places: [],
		ready: false,
	},
	mutations: {
		placesReady(state, places) {
			Vue.set(state, "places", places);
			Vue.set(state, "ready", true);
		},
		addPlace(state, place) {
			Vue.set(state, "places", state.places.concat(place));
		},
		removePlace(state, index) {
			state.places.splice(index, 1);
		},
		changePlace(state, changes) {
			let place = state.places[changes.index];
			let keys = Object.keys(changes.change);
			for(var i = 0; i < keys.length; i++) {
				place[keys[i]] = changes.change[keys[i]];
			}
		},
	},
	actions: {
		setPlaces({ commit }) {
			let placesRequest = new XMLHttpRequest();
			placesRequest.open("GET", "/json/places.json", true);
			placesRequest.onreadystatechange = function(event) {
				if(placesRequest.readyState == 4) {
					if(placesRequest.status == 200) {
						commit("placesReady", JSON.parse(placesRequest.responseText));
					} else {
						console.log("Не могу скачать /json/places.json");
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

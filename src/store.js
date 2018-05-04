export const store = new Vuex.Store({
	state: {places: []},
	mutations: {
		jsoned(state, places) {
			Vue.set(state, "places", places);
		},
	},
	actions: {
		setPlaces({ commit }) {
			let placesRequest = new XMLHttpRequest();
			placesRequest.open("GET", "/json/places.json", true);
			placesRequest.onreadystatechange = function(event) {
				if(placesRequest.readyState == 4) {
					if(placesRequest.status == 200) {
						commit("jsoned", JSON.parse(placesRequest.responseText));
					} else {
						console.log("Не могу скачать /json/places.json");
					}
				}
			};
			placesRequest.send(null);
		},
	},
	getters: {
		getPlaces: state => state.places,
		getDetailed: (state, getters) => (id) => {
			return state.places.find(p => p.id === id);
		},
	},
});

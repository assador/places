export const store = new Vuex.Store({
	state: {
		places: [],
		imagesCount: 0,
		center: {},
		empty: true,
		ready: false,
		message: "",
		placeFields: {
			srt         : "Сортировка",
			id          : "Идентификатор метки",
			name        : "Название",
			description : "Описание",
			latitude    : "Широта",
			longitude   : "Долгота",
			images      : "Фотографии",
		},
		lengths: {
			name        : 500,
			description : 5000,
			url         : 2048,
		},
		dirs: {
			common: "/var/www/places/",
			upload: {
				images: {
					big: "/uploads/images/big/",
					small: "/uploads/images/small/",
				},
			},
		},
	},
	mutations: {
		setMessage(state, message) {
			Vue.set(state, "message", state.message += (state.message != "" ? "<br />" : "") + message);
			if(typeof(document.intrvl) == "undefined") {
				document.intrvl = setInterval(function() {
					Vue.set(state, "message", state.message.replace(/^.*?(<br\ \/>|$)/, ""));
					if(state.message == "") {
						clearInterval(document.intrvl);
						delete document.intrvl;
					}
				}, 10000);
			}
		},
		placesReady(state, places, empty) {
			Vue.set(state, "places", places);
			Vue.set(state, "empty", empty);
			Vue.set(state, "ready", true);
		},
		updateImagesCount(state, imagesCount) {
			Vue.set(state, "imagesCount", imagesCount);
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
				Vue.set(place, keys[i], changes.change[keys[i]]);
			}
			Vue.set(state.places, changes.index, place);
		},
		swapValues(state, changes) {
			let p1 = changes.parent[changes.indexes[0]];
			let p2 = changes.parent[changes.indexes[1]];
			changes.values.forEach(function(key) {
//				p1[key] = [p2[key], p2[key] = p1[key]][0];
				Vue.set(p1, key, [p2[key], Vue.set(p2, key, p1[key])][0]);
			});
		},
		changeCenter(state, center) {
			Vue.set(state, "center", center);
		},
	},
	actions: {
		setPlaces({ state, commit }) {
			let placesRequest = new XMLHttpRequest();
			placesRequest.open("GET", "/backend/get_places.php", true);
			placesRequest.onreadystatechange = function(event) {
				if(placesRequest.readyState == 4) {
					if(placesRequest.status == 200) {
						let places = JSON.parse(placesRequest.responseText);
						Vue.set(state, "imagesCount", places.pop());
						commit("placesReady", places, false);
					} else {
						alert("Не могу получить данные из БД");
						commit("placesReady", [], true);
					}
				}
			};
			placesRequest.send(null);
		},
	},
	getters: {
		getMessage: (state, getters) => {
			return state.message;
		},
		getPlace: (state, getters) => (index) => {
			return state.places[index];
		},
		getImages: (state, getters) => (index) => {
			return state.places[index].images;
		},
		getImagesCount: (state, getters) => {
			return state.imagesCount;
		},
		getIndexById: (state, getters) => (args) => {
			return args.parent.indexOf(args.parent.find(p => p.id === args.id));
		},
	},
});

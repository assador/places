import {bus} from "./shared/bus.js"
export const store = new Vuex.Store({
	state: {
		status: 0,
		already: false,
		login: "",
		places: [],
		imagesCount: 0,
		center: {},
		ready: false,
		message: "",
		placeFields: {
			name        : "Название",
			description : "Описание",
			latitude    : "Широта",
			longitude   : "Долгота",
			srt         : "Сортировка",
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
		unload(state) {
			Vue.set(state, "status", 0);
			Vue.set(state, "already", false);
			Vue.set(state, "login", "");
			Vue.set(state, "places", []);
			Vue.set(state, "imagesCount", 0);
			Vue.set(state, "center", {});
			Vue.set(state, "ready", false);
			Vue.set(state, "message", "");
			localStorage.removeItem("user-token");
			localStorage.removeItem("user-id");
		},
		loaded(state) {
			Vue.set(state, "status", 1);
		},
		already(state) {
			Vue.set(state, "already", true);
		},
		login(state, login) {
			Vue.set(state, "login", login);
		},
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
		placesReady(state, places) {
			Vue.set(state, "places", places);
			Vue.set(state, "ready", true);
			for(let place of places) {
				Vue.set(place, "added", false);
				Vue.set(place, "deleted", false);
				Vue.set(place, "updated", false);
			}
		},
		updateImagesCount(state, imagesCount) {
			Vue.set(state, "imagesCount", imagesCount);
		},
		modifyPlaces(state, places) {
			Vue.set(state, "places", places);
		},
		addPlace(state, place) {
			Vue.set(state, "places", state.places.concat(place));
		},
		removePlace(state, index) {
			Vue.set(state.places[index], "added", false);
			Vue.set(state.places[index], "deleted", true);
			Vue.set(state.places[index], "updated", false);
		},
		changePlace(state, changes) {
			let place = state.places[changes.index];
			let keys = Object.keys(changes.change);
			for(var i = 0; i < keys.length; i++) {
				Vue.set(place, keys[i], changes.change[keys[i]]);
			}
			Vue.set(state.places, changes.index, place);
			Vue.set(state.places[changes.index], "updated", true);
		},
		swapValues(state, changes) {
			let p1 = changes.parent[changes.indexes[0]];
			let p2 = changes.parent[changes.indexes[1]];
			changes.values.forEach(function(key) {
				Vue.set(p1, key, [p2[key], Vue.set(p2, key, p1[key])][0]);
			});
			Vue.set(p1, "updated", true);
			Vue.set(p2, "updated", true);
		},
		changeCenter(state, center) {
			Vue.set(state, "center", center);
		},
	},
	actions: {
		setPlaces({state, commit}) {
			let placesRequest = new XMLHttpRequest();
			placesRequest.open("GET", "/backend/get_places.php?id=" + localStorage.getItem("user-id"), true);
			placesRequest.onreadystatechange = function(event) {
				if(placesRequest.readyState == 4) {
					if(placesRequest.status == 200) {
						let places = JSON.parse(placesRequest.responseText);
						Vue.set(state, "imagesCount", places.pop());
						commit("placesReady", places, false);
						bus.$emit("placesFilled");
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
			return args.parent.indexOf(args.parent.find(p => p.id == args.id));
		},
	},
});

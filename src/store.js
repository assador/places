import {bus} from "./shared/bus.js"
export const store = new Vuex.Store({
	state: {
		status: 0,
		already: false,
		places: [],
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
		reset(state) {
			Vue.set(state, "status", 0);
			Vue.set(state, "already", false);
			Vue.set(state, "places", []);
			Vue.set(state, "center", {});
			Vue.set(state, "ready", false);
			Vue.set(state, "message", "");
		},
		loaded(state) {
			Vue.set(state, "status", 1);
		},
		already(state) {
			Vue.set(state, "already", true);
		},
		setMessage(state, message) {
			let last = state.message.match(/([^<>]+)$/);
			if(last != null && last[1] == message) {
				Vue.set(state, "message", state.message.replace(/[^<>]+$/, ""));
				setTimeout(function() {
					Vue.set(state, "message", state.message += message);
				}.bind(message), 200);
			} else {
				Vue.set(state, "message", state.message += (state.message != "" ? "<br />" : "") + message);
			}
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
		placesReady(state, payload) {
			Vue.set(state, "places", payload.places);
			Vue.set(state, "ready", true);
			let added = false, deleted = false, updated = false;
			switch(payload.what) {
				case "added" :
					added = true;
					break;
				case "deleted" :
					deleted = true;
					break;
				case "updated" :
					updated = true;
					break;
			}
			for(let place of payload.places) {
				Vue.set(place, "added", added);
				Vue.set(place, "deleted", deleted);
				Vue.set(place, "updated", updated);
				Vue.set(place, "show", true);
			}
		},
		show(state, index) {
			Vue.set(state.places[index], "show", true);
		},
		hide(state, index) {
			Vue.set(state.places[index], "show", false);
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
		unload({state, commit}) {
			commit("reset");
			localStorage.removeItem("user-token");
			localStorage.removeItem("user-id");
		},
		ipdateIds({state, commit, dispatch}) {
			return new Promise((resolve, reject) => {
				for(let place of state.places) {
					place.userid = localStorage.getItem("user-id");
					place.id = generateRandomString(32);
					place.images = [];
				}
				commit("modifyPlaces", state.places);
				resolve(state.places);
			});
		},
		setPlaces({state, commit, dispatch}, json) {
			if(!json) {
				let placesRequest = new XMLHttpRequest();
				placesRequest.open("GET", "/backend/get_places.php?id=" + localStorage.getItem("user-id"), true);
				placesRequest.onreadystatechange = function(event) {
					if(placesRequest.readyState == 4) {
						if(placesRequest.status == 200) {
							let places = JSON.parse(placesRequest.responseText);
							commit("placesReady", {places: places});
							bus.$emit("placesFilled");
						} else {
							commit("setMessage", "Не могу получить данные из БД");
							commit("placesReady", {places: []});
						}
					}
				};
				placesRequest.send(null);
			} else {
				commit("modifyPlaces", JSON.parse(json));
				dispatch("ipdateIds")
					.then(response => {
						commit("placesReady", {places: state.places, what: "added"});
						bus.$emit("placesFilled");
					})
					.catch(error => {
						commit("placesReady", {places: []});
					});
			}
		},
	},
	getters: {
		getLogin: (state, getters) => {
			return localStorage.getItem("user-login");
		},
		getMessage: (state, getters) => {
			return state.message;
		},
		getPlace: (state, getters) => (index) => {
			return state.places[index];
		},
		getImages: (state, getters) => (index) => {
			return state.places[index].images;
		},
		getIndexById: (state, getters) => (args) => {
			return args.parent.indexOf(args.parent.find(p => p.id == args.id));
		},
	},
});

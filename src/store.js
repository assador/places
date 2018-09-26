import {bus} from "./shared/bus.js"
export const store = new Vuex.Store({
	state: {
		status: 0,
		user: {},
		places: [],
		commonPlaces: [],
		center: {},
		ready: false,
		message: "",
		placeFields: {
			name        : "Название",
			description : "Описание",
			latitude    : "Широта",
			longitude   : "Долгота",
			srt         : "Сортировка",
			common      : "Приватность",
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
			Vue.set(state, "user", {});
			Vue.set(state, "places", []);
			Vue.set(state, "center", {});
			Vue.set(state, "ready", false);
			Vue.set(state, "message", "");
		},
		loaded(state) {
			Vue.set(state, "status", 1);
		},
		setUser(state, user) {
			Vue.set(state, "user", user);
		},
		setMessage(state, message) {
			let last = state.message.match(/([^<>]+)$/);
			if(last != null && last[1] == message) {
				Vue.set(state, "message", state.message.replace(/[^<>]+$/, ""));
				document.messageTimeout = setTimeout(function() {
					Vue.set(state, "message", state.message += message);
					document.messageTimeout = undefined;
				}.bind(message), 200);
			} else {
				Vue.set(state, "message", state.message += (state.message != "" ? "<br />" : "") + message);
			}
			if(typeof document.messageInterval === "undefined") {
				document.messageInterval = setInterval(function() {
					Vue.set(state, "message", state.message.replace(/^.*?(<br\ \/>|$)/, ""));
					if(state.message == "") {
						clearInterval(document.messageInterval);
						document.messageInterval = undefined;
					}
				}, 10000);
			}
		},
		placesReady(state, payload) {
			Vue.set(state, "places", payload.places);
			if("commonPlaces" in payload) {
				Vue.set(state, "commonPlaces", payload.commonPlaces);
			}
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
		modifyCommonPlaces(state, commonPlaces) {
			Vue.set(state, "commonPlaces", commonPlaces);
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
			localStorage.removeItem("places-session");
			localStorage.removeItem("places-userid");
		},
		ipdateIds({state, commit}) {
			return new Promise((resolve, reject) => {
				for(let place of state.places) {
					place.userid = localStorage.getItem("places-userid");
					place.id = generateRandomString(32);
					place.images = [];
				}
				commit("modifyPlaces", state.places);
				resolve(state.places);
			});
		},
		setUser({state, commit}) {
			return new Promise((resolve, reject) => {
				let userRequest = new XMLHttpRequest();
				userRequest.open("GET", "/backend/get_account.php?id=" + localStorage.getItem("places-userid"), true);
				userRequest.onreadystatechange = function(event) {
					if(userRequest.readyState == 4) {
						if(userRequest.status == 200) {
							let user = JSON.parse(userRequest.responseText);
							commit("setUser", user);
							resolve("Данные аккаунта успешно получены");
						} else {
							commit("setMessage", "Не могу получить данные");
							commit("setUser", {});
							reject(new Error("Не могу получить данные"));
						}
					}
				};
				userRequest.send(null);
			});
		},
		setPlaces({state, commit, dispatch}, json) {
			if(!json) {
				let placesRequest = new XMLHttpRequest();
				placesRequest.open("GET", "/backend/get_places.php?id=" + localStorage.getItem("places-userid"), true);
				placesRequest.onreadystatechange = function(event) {
					if(placesRequest.readyState == 4) {
						if(placesRequest.status == 200) {
							let all_places = JSON.parse(placesRequest.responseText);
							let places = all_places[0], commonPlaces = all_places[1];
							commit("placesReady", {places: places, commonPlaces: commonPlaces});
							bus.$emit("placesFilled");
						} else {
							commit("setMessage", "Не могу получить данные из БД");
							commit("placesReady", {places: [], commonPlaces: []});
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
			return state.user.login;
		},
		getMessage: (state, getters) => {
			return state.message;
		},
		getPlace: (state, getters) => (index, common = false) => {
			return !common
				? state.places[index]
				: state.commonPlaces[index]
			;
		},
		getImages: (state, getters) => (index, common = false) => {
			return !common
				? state.places[index].images
				: state.commonPlaces[index].images
			;
		},
		getIndexById: (state, getters) => (args) => {
			return args.parent.indexOf(args.parent.find(p => p.id == args.id));
		},
	},
});

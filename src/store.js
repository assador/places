import {constants} from "./shared/constants.js"
import {bus} from "./shared/bus.js"
export const store = new Vuex.Store({
	state: {
		user: {},
		places: [],
		folders: [],
		commonPlaces: [],
		center: {
			latitude: constants.map.initial.latitude,
			longitude: constants.map.initial.longitude,
		},
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
			uploads: {
				images: {
					big: "/uploads/images/big/",
					small: "/uploads/images/small/",
				},
			},
		},
	},
	mutations: {
		reset(state) {
			Vue.set(state, "places", []);
			Vue.set(state, "folders", []);
			Vue.set(state, "center", {
				latitude: constants.map.initial.latitude,
				longitude: constants.map.initial.longitude,
			});
			Vue.set(state, "ready", false);
			Vue.set(state, "message", "");
		},
		setUser(state, user) {
			Vue.set(state, "user", user);
		},
		placesReady(state, payload) {
			Vue.set(state, "places", payload.places);
			Vue.set(state, "commonPlaces", payload.commonPlaces);
			Vue.set(state, "folders", payload.folders);
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
			function setFoldersStates(folders) {
				for(let folder of folders) {
					Vue.set(folder, "added", added);
					Vue.set(folder, "deleted", deleted);
					Vue.set(folder, "updated", updated);
					if(folder.hasOwnProperty("children")) {
						setFoldersStates(folder.children);
					}
				}
			}
			setFoldersStates(payload.folders);
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
		modifyFolders(state, folders) {
			Vue.set(state, "folders", folders);
		},
		modifyCommonPlaces(state, commonPlaces) {
			Vue.set(state, "commonPlaces", commonPlaces);
		},
		addPlace(state, place) {
			Vue.set(state, "places", state.places.concat(place));
		},
		removePlace(state, place) {
			Vue.set(place, "added", false);
			Vue.set(place, "deleted", true);
			Vue.set(place, "updated", false);
		},
		deletePlace(state, place) {
			state.places.splice(state.places.indexOf(place), 1);
			Vue.set(state, "places", state.places);
		},
		deletePlacesMarkedAsDeleted(state) {
			for(var i = 0; i < state.places.length; i++) {
				if(state.places[i].deleted) {
					state.places.splice(i, 1);
					i--;
				}
			}
		},
		changePlace(state, changes) {
			let keys = Object.keys(changes.change), toUpdated = true;
			for(var i = 0; i < keys.length; i++) {
				Vue.set(changes.place, keys[i], changes.change[keys[i]]);
				if(keys[i] === "updated") {
					toUpdated = false;
				}
			}
			if(toUpdated) {
				Vue.set(changes.place, "updated", true);
			}
		},
		addFolder(state, folder) {
			Vue.set(state, "folders", state.folders.concat(folder));
		},
		addImporting(state, payload) {
			let folderNewId, foundExistingFolder;
			for(let folder of payload.folders) {
				foundExistingFolder = state.folders.find(f => f.name === folder.name);
				if(typeof(foundExistingFolder) === "undefined") {
					folderNewId = generateRandomString(32);
					for(let nestedFolder of payload.folders) {
						if(nestedFolder.parent === folder.id) {
							Vue.set(nestedFolder, "parent", folderNewId);
						}
					}
					Vue.set(state, "folders", state.folders.concat(folder));
				} else {
					folderNewId = foundExistingFolder.id;
				}
				for(let nestedPlace of payload.places) {
					if(nestedPlace.folderid === folder.id) {
						Vue.set(nestedPlace, "folderid", folderNewId);
					}
				}
				Vue.set(folder, "id", folderNewId);
			}
			for(let place of payload.places) {
				if(
					typeof(state.places.find(p =>
						p.latitude == place.latitude
						&& p.longitude == place.longitude
					)) === "undefined"
				) {
					let placeNewId = generateRandomString(32);
					Vue.set(place, "id", placeNewId);
					Vue.set(state, "places", state.places.concat(place));
				}
			}
		},
		deleteFolder(state, folder) {
			state.folders.splice(state.folders.indexOf(folder), 1);
			Vue.set(state, "folders", state.folders);
		},
		deleteFoldersMarkedAsDeleted(state) {
			for(var i = 0; i < state.folders.length; i++) {
				if(state.folders[i].deleted) {
					state.folders.splice(state.folders.indexOf(state.folders[i]), 1);
					i--;
				}
			}
		},
		changeFolder(state, changes) {
			let keys = Object.keys(changes.change), toUpdated = true;
			for(var i = 0; i < keys.length; i++) {
				Vue.set(changes.folder, keys[i], changes.change[keys[i]]);
				if(keys[i] === "updated") {
					toUpdated = false;
				}
			}
			if(toUpdated) {
				Vue.set(changes.folder, "updated", true);
			}
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
		adaptImporting({state, commit}) {
			return new Promise((resolve, reject) => {
				for(let place of state.places) {
					place.userid = localStorage.getItem("places-userid");
					place.images = [];
				}
				for(let folder of state.folders) {
					folder.userid = localStorage.getItem("places-userid");
				}
				commit("modifyPlaces", state.places);
				commit("modifyFolders", state.folders);
				resolve(state);
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
							dispatch("setMessage", "Не могу получить данные");
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
							let places = all_places[0], commonPlaces = all_places[1], folders = all_places[2];
							places = sortObjects(places, "srt");
							sortObjectsByProximity(commonPlaces);
							folders = sortObjects(folders, "srt");
							commit("placesReady", {places: places, commonPlaces: commonPlaces, folders: folders});
							bus.$emit("placesFilled");
						} else {
							dispatch("setMessage", "Не могу получить данные из БД");
							commit("placesReady", {places: [], commonPlaces: [], folders: []});
						}
					}
				};
				placesRequest.send(null);
			} else {
				let parsedJSON = JSON.parse(json);
				commit("addImporting", {places: parsedJSON.places, folders: parsedJSON.folders});
				dispatch("adaptImporting")
					.then(response => {
						commit("placesReady", {places: state.places, commonPlaces: state.commonPlaces, folders: state.folders, what: "added"});
						bus.$emit("placesFilled", "importing");
					})
					.catch(error => {
						commit("placesReady", {places: [], commonPlaces: [], folders: []});
					});
			}
		},
		clearMessage({state}, hide) {
			let message;
			if(hide || (message = state.message.replace(/^<div>[^<>]+<\/div>\s*/, "")) === "") {
				let me = document.getElementById("message-main");
				if(me) {
					me.classList.add("invisible");
					me.classList.remove("visible");
				}
				setTimeout(function() {
					Vue.set(state, "message", "");
				}, 500);
			} else {
				Vue.set(state, "message", message);
			}
		},
		setMessage({state, dispatch}, message) {
			let last = state.message.match(/<div>([^<>]+)<\/div>\s*$/);
			if(last && last[1] === message) {
				document.getElementById("message-main").lastElementChild.classList.add("highlight");
				setTimeout(function() {
					if(document.getElementById("message-main").lastElementChild) {
						document.getElementById("message-main").lastElementChild.classList.remove("highlight");
					}
				}, 500);
			} else {
				Vue.set(state, "message", state.message += "<div>" + message + "</div>");
			}
			let me = document.getElementById("message-main");
			if(me) {
				me.classList.add("visible");
				me.classList.remove("invisible");
			}
			clearTimeout(document.messageTimer);
			document.messageTimer = setTimeout(function messageTimeout() {
				dispatch("clearMessage");
				if(state.message !== "") {
					document.messageTimer = setTimeout(messageTimeout, 3000);
				}
			}, 3000);
		},
	},
	getters: {
		getMessage: (state, getters) => {
			return state.message;
		},
		getAccountDeleteMessage: (state, getters) => {
			return state.message;
		},
		getAccountChangeMessage: (state, getters) => {
			return state.message;
		},
		getImages: (state, getters) => (place, common = false) => {
			place.images = sortObjects(place.images, "srt");
			return place.images;
		},
		getIndexById: (state, getters) => (args) => {
			return args.parent.indexOf(args.parent.find(p => p.id == args.id));
		},
	},
});

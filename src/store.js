import {constants} from "./shared/constants.js"
import {bus} from "./shared/bus.js"
const tracking = store => {
	const trackingMutations = [
		"addFolder",
		"addImporting",
		"addPlace",
		"changeFolder",
		"changePlace",
		"deleteFolder",
		"deletePlace",
		"modifyFolders",
		"modifyPlaces",
		"removePlace",
		"swapValues",
	];
	store.subscribe((mutation, state) => {
		if(trackingMutations.includes(mutation.type) && mutation.payload) {
			store.commit("setSaved", false);
			if(
				(
					!mutation.payload.hasOwnProperty("backup")
					|| mutation.payload.backup
				) && (
					mutation.payload.hasOwnProperty("type")
					|| mutation.payload.hasOwnProperty("change")
				)
			) {
				if(
					mutation.payload.added
					|| mutation.payload.deleted
					|| mutation.payload.updated
					|| mutation.payload.change
						&& (
							mutation.payload.change.added
							|| mutation.payload.change.deleted
							|| mutation.payload.change.updated
						)
				) {
					if(!state.inUndoRedo) {
						if(mutation.payload.hasOwnProperty("type")) {
							bus.$emit("toDB", mutation.payload.type + "s");
							store.commit("savedToDB", mutation.payload);
						}
						if(mutation.payload.hasOwnProperty("change")) {
							if(mutation.payload.hasOwnProperty("place")) {
								bus.$emit("toDB", "places");
								store.commit("savedToDB", mutation.payload.place);
							}
							if(mutation.payload.hasOwnProperty("folder")) {
								bus.$emit("toDB", "folders");
								store.commit("savedToDB", mutation.payload.folder);
							}
						}
					} else {
						bus.$emit("toDBCompletely");
						store.commit("outUndoRedo");
					}
				}
				if(mutation.type !== "removePlace") {
					store.commit("backupState");
				}
			}
		}
	});
};
export const store = new Vuex.Store({
	plugins: [tracking],
	state: {
		saved: true,
		stateBackups: [],
		stateBackupsIndex: -1,
		inUndoRedo: false,
		user: {},
		currentPlace: {},
		homePlace: {},
		currentPlaceIndex: -1,
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
	},
	mutations: {
		setSaved(state, saved) {
			Vue.set(state, "saved", saved);
		},
		foldersToTree(state) {
			Vue.set(state, "folders", plainToTree(state.folders));
		},
		backupState(state) {
			state.stateBackups.splice(++state.stateBackupsIndex, Infinity, {
				places: JSON.parse(JSON.stringify(state.places)),
				folders: JSON.parse(JSON.stringify(state.folders)),
				currentPlaceIndex: state.currentPlaceIndex,
			});
			Vue.set(state, "stateBackupsIndex", state.stateBackups.length - 1);
			if(state.stateBackups.length > constants.backupscount) {
				state.stateBackups.shift();
				state.stateBackupsIndex--;
			}
		},
		restoreState(state, index) {
			Vue.set(state, "places",
				JSON.parse(JSON.stringify(state.stateBackups[index].places))
			);
			Vue.set(state, "folders",
				JSON.parse(JSON.stringify(state.stateBackups[index].folders))
			);
			bus.$emit("setCurrentPlace", {
				place: state.stateBackups[index].currentPlaceIndex < 0
					? {}
					: state.places[state.stateBackups[index].currentPlaceIndex]
			});
		},
		stateBackupsIndexChange(state, delta) {
			Vue.set(state, "stateBackupsIndex", state.stateBackupsIndex + delta);
		},
		inUndoRedo(state) {
			Vue.set(state, "inUndoRedo", true);
		},
		outUndoRedo(state) {
			Vue.set(state, "inUndoRedo", false);
		},
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
		savedToDB(state, object) {
			Vue.set(object, "added", false);
			Vue.set(object, "deleted", false);
			Vue.set(object, "updated", false);
		},
		setUser(state, user) {
			Vue.set(state, "user", user);
		},
		setCurrentPlace(state, place) {
			Vue.set(state, "currentPlace", place);
			Vue.set(state, "currentPlaceIndex", state.places.indexOf(state.currentPlace));
		},
		setHomePlace(state, id) {
			let place = state.places.find(p => p.id === id);
			Vue.set(state, "homePlace", (place ? place : {}));
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
				Vue.set(place, "type", "place");
				Vue.set(place, "added", added);
				Vue.set(place, "deleted", deleted);
				Vue.set(place, "updated", updated);
				Vue.set(place, "show", true);
			}
			for(let folder of payload.folders) {
				Vue.set(folder, "type", "folder");
				Vue.set(folder, "added", added);
				Vue.set(folder, "deleted", deleted);
				Vue.set(folder, "updated", updated);
				Vue.set(folder, "opened", false);
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
		modifyFolders(state, folders) {
			Vue.set(state, "folders", folders);
		},
		modifyCommonPlaces(state, commonPlaces) {
			Vue.set(state, "commonPlaces", commonPlaces);
		},
		addPlace(state, place) {
			Vue.set(state, "places", state.places.concat(place));
			Vue.set(state, "currentPlaceIndex", state.places.length - 1);
		},
		removePlace(state, payload) {
			Vue.set(payload.place, "added", false);
			Vue.set(payload.place, "deleted", true);
			Vue.set(payload.place, "updated", false);
		},
		deletePlace(state, place) {
			state.places.splice(state.places.indexOf(place), 1);
			Vue.set(state, "places", state.places);
			Vue.set(state, "currentPlaceIndex",
				state.places.indexOf(state.currentPlace)
			);
		},
		deletePlacesMarkedAsDeleted(state, payload) {
			for(let i = 0; i < state.places.length; i++) {
				if(state.places[i].deleted) {
					state.places.splice(i, 1);
					i--;
				}
			}
		},
		changePlace(state, changes) {
			let keys = Object.keys(changes.change), toUpdated = true;
			for(let i = 0; i < keys.length; i++) {
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
			let parent = findInTree(
				{id: "root", children: state.folders},
				"children",
				"id",
				folder.parent
			);
			if(!parent) {
				state.folders.push(folder);
			} else {
				if(!parent.children) {
					Vue.set(parent, "children", []);
				}
				parent.children.push(folder);
			}
		},
		addImporting(state, payload) {
			treeNewIds(
				{id: "root", children: payload.folders},
				"children",
				"parent",
				payload.places,
				"folderid"
			);
			Vue.set(state, "folders", state.folders.concat(payload.folders));
			for(let i = 0; i < payload.places.length; i++) {
				if(
					typeof(state.places.find(p =>
						p.latitude == payload.places[i].latitude
						&& p.longitude == payload.places[i].longitude
					)) !== "undefined"
				) {
					payload.places.splice(i, 1);
				}
			}
			Vue.set(state, "places", payload.places);
		},
		deleteFolder(state, payload) {
			payload.parent.children.splice(
				payload.parent.children.indexOf(payload.folder),
				1
			);
			Vue.set(state, "folders", state.folders);
		},
		deleteFoldersMarkedAsDeleted(state, payload) {
			changeByKeyValue({children: state.folders}, "children", "deleted", true, "delete");
		},
		changeFolder(state, changes) {
			let keys = Object.keys(changes.change), toUpdated = true;
			for(let i = 0; i < keys.length; i++) {
				Vue.set(changes.folder, keys[i], changes.change[keys[i]]);
				if(keys[i] === "updated") {
					toUpdated = false;
				}
			}
			if(toUpdated) {
				Vue.set(changes.folder, "updated", true);
			}
		},
		folderOpenClose(state, payload) {
			Vue.set(payload.folder, "opened", payload.opened);
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
		undo({state, commit, dispatch}) {
			if(state.stateBackupsIndex > 0) {
				commit("stateBackupsIndexChange", -1);
				dispatch("applyUndoRedo");
				store.commit("inUndoRedo");
				store.commit("setSaved", false);
			}
		},
		redo({state, commit, dispatch}) {
			if(state.stateBackupsIndex < state.stateBackups.length - 1) {
				commit("stateBackupsIndexChange", 1);
				dispatch("applyUndoRedo");
				if(state.stateBackupsIndex === state.stateBackups.length - 1) {
					store.commit("outUndoRedo");
					store.commit("setSaved", true);
				}
			}
		},
		applyUndoRedo({state, commit}) {
			commit("restoreState", state.stateBackupsIndex);
			bus.$emit("homeRefresh");
		},
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
							sortObjectsByProximity(all_places[1]);
							commit("placesReady", {places: all_places[0], commonPlaces: all_places[1], folders: all_places[2]});
							commit("setHomePlace", state.user.homeplace);
							commit("foldersToTree");
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
						commit("setHomePlace", state.user.homeplace);
						bus.$emit("placesFilled", "importing");
					})
					.catch(error => {
						commit("placesReady", {places: [], commonPlaces: [], folders: []});
					});
			}
		},
		moveFolder({state, commit}, payload) {
			let folder, source, target;
			folder = payload.hasOwnProperty("folder")
				? payload.folder
				: findInTree(
					{id: "root", children: state.folders},
					"children",
					"id",
					payload.folderId
				)
			;
			if(folder.parent === null) {
				source = state.folders;
			} else {
				source = findInTree(
					{id: "root", children: state.folders},
					"children",
					"id",
					folder.parent
				).children;
			}
			if(
				!payload.targetId
				|| payload.targetId === null
				|| payload.targetId === "root"
			) {
				target = state.folders;
			} else {
				target = findInTree(
					{id: "root", children: state.folders},
					"children",
					"id",
					payload.targetId
				);
				if(!target.children) {
					Vue.set(target, "children", new Array());
				}
				target = target.children;
			}
			let srt = (
				payload.hasOwnProperty("srt") ? payload.srt : (
					target.length > 0 ? target[target.length - 1].srt + 1 : 1
				)
			);
			target.push(source.splice(source.indexOf(folder), 1)[0]);
			commit("changeFolder", {
				folder: folder,
				change: {
					parent: payload.targetId === "root" ? null : payload.targetId,
					srt: srt,
					updated: true,
				},
				backup: !payload.hasOwnProperty("backup") || payload.backup ? true : false,
			});
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
			if(last !== null && last[1] === message) {
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
		getCurrentPlace: (state, getters) => {
			return state.currentPlace;
		},
		getMessage: (state, getters) => {
			return state.message;
		},
		getAccountDeleteMessage: (state, getters) => {
			return state.message;
		},
		getAccountChangeMessage: (state, getters) => {
			return state.message;
		},
		getIndexById: (state, getters) => (args) => {
			return args.parent.indexOf(args.parent.find(p => p.id == args.id));
		},
	},
});

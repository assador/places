import { constants } from '../shared/constants';
import { bus } from '../shared/bus';
import { commonFunctions } from '../shared/common';
import axios from 'axios';
import Vue from 'vue';
import Vuex, { Store, Plugin, MutationPayload } from 'vuex';
import { State, Waypoint, Place, Folder, Image } from './types';

Vue.use(Vuex);

const tracking: Plugin<State> = (store: Store<State>) => {
	const trackingMutations: string[] = [
		'addPlace',
		'addFolder',
		'changeWaypoint',
		'changePlace',
		'changeFolder',
		'deleteFolder',
		'deletePlace',
		'modifyFolders',
		'modifyPlaces',
		'swapImages',
		'setHomePlace',
		'setCurrentPlace',
		'placesReady',
		'stateReady',
	];
	store.subscribe((mutation: MutationPayload, state: State) => {
		if (trackingMutations.includes(mutation.type)) {
			if (!state.refreshing) {
				sessionStorage.setItem('places-store-state', JSON.stringify(state));
			}
			if (
				mutation.payload &&
				mutation.type !== 'setHomePlace' &&
				mutation.type !== 'setCurrentPlace' &&
				mutation.type !== 'placesReady' &&
				mutation.type !== 'stateReady' &&
				(
					mutation.payload.hasOwnProperty('backup') &&
					!!mutation.payload.backup ||
					!mutation.payload.hasOwnProperty('backup')
				) && !(
					mutation.payload.key && (
						mutation.payload.key === 'added' ||
						mutation.payload.key === 'deleted' ||
						mutation.payload.key === 'updated'
					)
				) && !(
					mutation.payload.change && (
						'added' in mutation.payload.change  ||
						'deleted' in mutation.payload.change  ||
						'updated' in mutation.payload.change
					)
				)
			) {
				store.commit('backupState');
			}
		}
	});
};

const store: Store<State> = new Vuex.Store<State>({
	plugins: [tracking],
	state: {
		refreshing: false,
		saved: true,
		idleTime: 0,
		stateBackups: [],
		stateBackupsIndex: -1,
		inUndoRedo: false,
		user: null,
		currentPlace: null,
		homePlace: null,
		waypoints: {},
		places: {},
		folders: {},
		commonPlaces: {},
		center: {
			latitude: constants.map.initial.latitude,
			longitude: constants.map.initial.longitude,
		},
		zoom: constants.map.initial.zoom,
		placemarksShow: true,
		commonPlacemarksShow: false,
		centerPlacemarkShow: false,
		ready: false,
		messages: [],
		placeFields: {
			name               : 'Название',
			description        : 'Описание',
			link               : 'Ссылка',
			latitude           : 'Широта',
			longitude          : 'Долгота',
			altitudecapability : 'Высота над уровнем моря (м)',
			time               : 'Время создания геометки (UTC)',
			srt                : 'Сортировка',
			common             : 'Приватность',
			images             : 'Фотографии',
		},
		messageTimer: 0,
		mouseOverMessages: false,
		serverConfig: null,
		rootPlace: {
			id: 'root',
			parent: null,
			name: 'Мои места',
			srt: 0,
			geomarks: 1,
			type: 'folder',
			added: false,
			deleted: false,
			updated: false,
			opened: true,
			builded: true,
		},
	},
	mutations: {
		setMessage(state, message) {
			state.messages.push(message);
		},
		clearMessages(state) {
			state.messages = [];
		},
		deleteMessage(state, index) {
			state.messages.splice(index, 1);
		},
		setMouseOverMessages(state, over) {
			state.mouseOverMessages = (over === false ? false : true);
		},
		setRefreshing(state, refreshing) {
			Vue.set(state, 'refreshing', refreshing);
		},
		setSaved(state, saved) {
			Vue.set(state, 'saved', (saved === false ? false : true));
		},
		setObjectSaved(state, object) {
			Vue.set(object, 'added', false);
			Vue.set(object, 'deleted', false);
			Vue.set(object, 'updated', false);
		},
		setIdleTime(state, time) {
			Vue.set(state, 'idleTime', time);
		},
		backupState(state) {
			if (state.stateBackups) {
				if (state.stateBackups.length === constants.backupscount) return;
				state.stateBackups.splice(++state.stateBackupsIndex);
				state.stateBackups.push(
					Object.assign({}, JSON.parse(JSON.stringify(state)))
				);
				Vue.delete(
					state.stateBackups[state.stateBackups.length - 1],
					'stateBackups'
				);
			}
		},
		restoreState(state, index) {
			if (state.stateBackups) {
				for (const key in Object(state.stateBackups[index])) {
					if (key !== 'stateBackups') {
						Vue.set(state, key,
							JSON.parse(
								JSON.stringify(
									state.stateBackups[index][key as keyof State]
								)
							)
						);
					}
				}
			}
		},
		stateBackupsIndexChange(state, delta) {
			Vue.set(state, 'stateBackupsIndex', state.stateBackupsIndex + delta);
		},
		inUndoRedo(state) {
			Vue.set(state, 'inUndoRedo', true);
		},
		outUndoRedo(state) {
			Vue.set(state, 'inUndoRedo', false);
		},
		reset(state) {
			Vue.set(state, 'saved', true);
			Vue.set(state, 'idleTime', 0);
			Vue.set(state, 'stateBackups', []);
			Vue.set(state, 'stateBackupsIndex', -1);
			Vue.set(state, 'inUndoRedo', false);
			Vue.set(state, 'user', null);
			Vue.set(state, 'currentPlace', null);
			Vue.set(state, 'homePlace', null);
			Vue.set(state, 'waypoints', {});
			Vue.set(state, 'places', {});
			Vue.set(state, 'folders', {});
			Vue.set(state, 'commonPlaces', {});
			Vue.set(state, 'center', {
				latitude: constants.map.initial.latitude,
				longitude: constants.map.initial.longitude,
			});
			Vue.set(state, 'ready', false);
			Vue.set(state, 'message', '');
			Vue.set(state, 'placeFields', {
				name               : 'Название',
				description        : 'Описание',
				link               : 'Ссылка',
				latitude           : 'Широта',
				longitude          : 'Долгота',
				altitudecapability : 'Высота над уровнем моря (м)',
				time               : 'Время создания геометки (UTC)',
				srt                : 'Сортировка',
				common             : 'Приватность',
				images             : 'Фотографии',
			});
		},
		setUser(state, user) {
			Vue.set(state, 'user', user);
		},
		setServerConfig(state, config) {
			Vue.set(state, 'serverConfig', config);
		},
		setCurrentPlace(state, place) {
			Vue.set(state, 'currentPlace', place);
		},
		setHomePlace(state, place) {
			state.homePlace = place;
			if (state.user) {
				state.user.homeplace = !place ? null : place.id;
			}
		},
		placesReady(state, payload) {
			if (payload.waypoints) {
				Vue.set(state, 'waypoints', payload.waypoints);
			}
			if (payload.places) {
				Vue.set(state, 'places', payload.places);
			}
			if (payload.commonPlaces) {
				Vue.set(state, 'commonPlaces', payload.commonPlaces);
			}
			if (payload.folders) {
				Vue.set(state, 'folders', payload.folders);
			}
			let added = false, deleted = false, updated = false;
			switch (payload.what) {
				case 'added' :
					added = true;
					break;
				case 'deleted' :
					deleted = true;
					break;
				case 'updated' :
					updated = true;
					break;
			}
			for (const id in payload.waypoints) {
				Vue.set(payload.waypoints[id], 'type', 'waypoint');
				Vue.set(payload.waypoints[id], 'added', added);
				Vue.set(payload.waypoints[id], 'deleted', deleted);
				Vue.set(payload.waypoints[id], 'updated', updated);
				Vue.set(payload.waypoints[id], 'show', true);
			}
			for (const id in payload.places) {
				Vue.set(payload.places[id], 'type', 'place');
				Vue.set(payload.places[id], 'added', added);
				Vue.set(payload.places[id], 'deleted', deleted);
				Vue.set(payload.places[id], 'updated', updated);
				Vue.set(payload.places[id], 'show', true);
			}
			for (const id in payload.folders) {
				Vue.set(payload.folders[id], 'type', 'folder');
				Vue.set(payload.folders[id], 'added', added);
				Vue.set(payload.folders[id], 'deleted', deleted);
				Vue.set(payload.folders[id], 'updated', updated);
				Vue.set(payload.folders[id], 'opened', false);
			}
			Vue.set(state, 'folders', commonFunctions.plainToTree(state.folders));
		},
		stateReady(state, ready) {
			Vue.set(state, 'ready', ready);
		},
		show(state, id) {
			Vue.set(state.places[id], 'show', true);
		},
		hide(state, id) {
			Vue.set(state.places[id], 'show', false);
		},
		modifyPlaces(state, places) {
			Vue.set(state, 'places', places);
		},
		modifyFolders(state, folders) {
			Vue.set(state, 'folders', folders);
		},
		modifyCommonPlaces(state, commonPlaces) {
			Vue.set(state, 'commonPlaces', commonPlaces);
		},
		addWaypoint(state, waypoint) {
			Vue.set(state.waypoints, waypoint.id, waypoint);
		},
		addPlace(state, place) {
			Vue.set(state.places, place.id, place);
		},
		deleteWaypoint(state, waypoint) {
			Vue.delete(state.waypoints, waypoint.id);
		},
		deletePlace(state, place) {
			Vue.delete(state.places, place.id);
		},
		addFolder(state, payload) {
			if (!payload.parent) {
				Vue.set(state.folders, payload.folder.id, payload.folder);
			} else {
				if (!payload.parent.children) {
					Vue.set(payload.parent, 'children', {});
				} else {
					Vue.set(payload.parent, 'needToRefreshTreeSorry', null);
					Vue.delete(payload.parent, 'needToRefreshTreeSorry');
				}
				Vue.set(payload.parent.children, payload.folder.id, payload.folder);
			}
		},
		deleteFolder(state, payload) {
			if (!payload.source) {
				payload.source = store.getters.treeFlat[payload.folder.parent];
			}
			Vue.delete(payload.source.children, payload.folder.id);
			Vue.set(payload.source, 'needToRefreshTreeSorry', null);
			Vue.delete(payload.source, 'needToRefreshTreeSorry');
		},
		changeWaypoint(state, payload) {
			Vue.set(payload.waypoint, payload.key, payload.value);
		},
		changePlace(state, payload) {
			Vue.set(payload.place, payload.key, payload.value);
		},
		changeFolder(state, payload) {
			Vue.set(payload.folder, payload.key, payload.value);
		},
		deleteImages(state, payload) {
			if (!payload.images || !Object.keys(payload.images).length) return;
			for (const id in payload.images) {
				if (
					state.places[payload.images[id].placeid] &&
					state.places[payload.images[id].placeid].images[id]
				) {
					Vue.delete(state.places[payload.images[id].placeid].images, id);
				}
			}
		},
		folderOpenClose(state, payload) {
			Vue.set(
				payload.folder,
				'opened',
				payload.hasOwnProperty('opened')
					? payload.opened
					: !payload.folder.opened
			);
		},
		swapImages(state, changes) {
			Vue.set(
				changes.place.images[changes.ids[0]],
				'srt',
				[
					changes.place.images[changes.ids[1]].srt,
					Vue.set(
						changes.place.images[changes.ids[1]],
						'srt',
						changes.place.images[changes.ids[0]].srt
					)
				][0]
			);
			Vue.set(changes.place, 'updated', true);
		},
		changeMap(state, payload) {
			if (payload.latitude) state.center.latitude = payload.latitude;
			if (payload.longitude) state.center.longitude = payload.longitude;
			if (payload.zoom) state.zoom = payload.zoom;
		},
		placemarksShowHide(state, show) {
			Vue.set(state, 'placemarksShow', show);
		},
		commonPlacemarksShowHide(state, show) {
			Vue.set(state, 'commonPlacemarksShow', show);
		},
		centerPlacemarkShowHide(state, show) {
			Vue.set(state, 'centerPlacemarkShow', show);
		},
		setMessageTimer(state, messageTimer) {
			Vue.set(state, 'messageTimer', messageTimer);
		},
	},
	actions: {
		restoreState({commit, dispatch}, backupIndex) {
			commit('restoreState', backupIndex);
			dispatch('restoreObjectsAsLinks')
				.then(() => {
					bus.$emit('refreshMapOpenStreetMapMarks');
					bus.$emit('refreshMapYandexMarks');
				});
		},
		undo({state, commit, dispatch}) {
			if (state.stateBackupsIndex > 0) {
				commit('stateBackupsIndexChange', -1);
				dispatch('restoreState', state.stateBackupsIndex);
				commit('inUndoRedo');
				commit('setSaved', false);
			}
		},
		redo({state, commit, dispatch}) {
			if (
				state.stateBackups &&
				state.stateBackupsIndex < state.stateBackups.length - 1
			) {
				commit('stateBackupsIndexChange', 1);
				dispatch('restoreState', state.stateBackupsIndex);
				if (state.stateBackupsIndex === state.stateBackups.length - 1) {
					commit('outUndoRedo');
					commit('setSaved', true);
				}
			}
		},
		unload({commit}) {
			commit('reset');
			sessionStorage.removeItem('places-store-state');
			sessionStorage.removeItem('places-userid');
			sessionStorage.removeItem('places-session');
		},
		setUser({commit, dispatch}) {
			axios
				.get(
					'/backend/get_account.php?id=' +
					sessionStorage.getItem('places-userid')
				)
				.then(response => {
					commit('setUser', response.data);
					dispatch('setServerConfig');
				})
				.catch(() => {
					dispatch('setMessage', 'Не могу получить данные.');
					commit('setUser', null);
				})
			;
		},
		setServerConfig({commit, dispatch}) {
			axios
				.get(
					'/backend/get_config.php?userid=' +
					sessionStorage.getItem('places-userid')
				)
				.then(response => {
					commit('setServerConfig', response.data);
				})
				.catch(() => {
					dispatch('setMessage', 'Не могу получить данные.');
					commit('setServerConfig', null);
				})
			;
		},
		async setPlaces({state, commit, dispatch, getters}, payload) {
			commit('stateReady', false);
			if (!payload) {
			// If reading from database, not importing
				axios
					.get(
						'/backend/get_places.php?id=' +
						sessionStorage.getItem('places-userid')
					)
					.then(response => {
						commit('placesReady', {
							waypoints: response.data.waypoints,
							places: response.data.places,
							commonPlaces: response.data.common_places,
							folders: response.data.folders,
						});
						commit('setHomePlace', (state.user.homeplace
							? state.places[state.user.homeplace]
							: null
						));
						commit('stateReady', true);
					})
					.catch(() => {
						dispatch('setMessage', 'Не могу получить данные из БД.');
						commit('placesReady', {
							waypoints: {},
							places: {},
							commonPlaces: {},
							folders: {},
						});
					})
				;
				return;
			}
			/*
			If importing from file.
			A payload parameter is present and is an object:
			{text: <file’s content as a text>, type: <file’s MIME-type>}
			*/
			function parseJSON(text: string) {
				try {
					const result =
						<Record<string, Array<Place | Waypoint | Folder>>>
						JSON.parse(payload.text)
					;
					return result;
				} catch (e) {
					dispatch('setMessage',
						'Ошибка при разборе импортируемого файла: ' + e
					);
					return null;
				}
			}
			function parseGPX(text: string) {
				const result = {
					waypoints: [] as Array<Waypoint>,
					places: [] as Array<Place>,
					tree: {} as Folder,
				};
				// Parsing XML text to a DOM tree
				let dom = null;
				try {
					dom = (new DOMParser()).parseFromString(
						text, 'text/xml'
					);
				} catch (e) {
					dispatch('setMessage',
						'Ошибка при разборе импортируемого файла: ' + e
					);
					return null;
				}
				if (getters.treeFlat.imported) {
					result.tree = getters.treeFlat.imported;
				}
				let importedPlaceFolder, importedFolder: Folder;
				let description = '', time = '';
				for (const wpt of dom.getElementsByTagName('wpt')) {
					// Parsing a time node in a place node
					time = '';
					if (wpt.getElementsByTagName('time').length) {
						time = wpt.getElementsByTagName('time')[0].textContent.trim();
					}
					/*
					Updating the tree branch of folders for imported places
					and get an ID of a folder for the importing place
					*/
					importedPlaceFolder = commonFunctions.formFolderForImported(
						time.slice(0, 10),
						importedFolder
					);
					importedFolder = importedPlaceFolder.imported;
					// Parsing a description node in a place node
					description = '';
					if (wpt.getElementsByTagName('desc').length) {
						for (const desc of wpt.getElementsByTagName('desc')[0].childNodes) {
							try {
								switch (desc.nodeType) {
									case 1 : case 3 :
										description +=
											desc.textContent.trim() +
											(desc.nextSibling ? '\n' : '');
										break;
									case 4 :
										const reStr: string =
											'desc_(?:user|test)' +
											'\s*\:\s*start\s*--\s*>\s*' +
											'(.*?)' +
											'\s*<\s*\!\s*--\s*' +
											'desc_(?:user|test)' +
											'\s*\:\s*end'
										;
										const descs = desc.textContent.match(
											new RegExp(reStr, 'gi')
										);
										for (let i = 0; i < descs.length; i++) {
											description += descs[i].replace(
												new RegExp(reStr, 'i'), "$1"
											) + (desc.nextSibling ? '\n' : '');
										}
										break;
								}
							} catch (e) {}
						}
					}
					// Forming an importing place as an object and pushing it in a structure
					const newWaypointId = commonFunctions.generateRandomString(32);
					const newPlaceId = commonFunctions.generateRandomString(32);
					const newWaypoint = {
						id: newWaypointId,
						latitude: parseFloat(wpt.getAttribute('lat')),
						longitude: parseFloat(wpt.getAttribute('lon')),
						altitudecapability: (wpt.getElementsByTagName('ele').length
							? parseFloat(wpt.getElementsByTagName('ele')[0].textContent.trim())
							: null
						),
						time: time,
						type: 'waypoint',
						common: false,
						added: true,
						deleted: false,
						updated: false,
						show: true,
					};
					const newPlace = {
						id: newPlaceId,
						waypoint: newWaypointId,
						folderid: importedPlaceFolder.folderid,
						name: (wpt.getElementsByTagName('name').length
							? wpt.getElementsByTagName('name')[0].textContent.trim()
							: ''
						),
						description: description,
						link: (wpt.getElementsByTagName('link').length
							? wpt.getElementsByTagName('link')[0].getAttribute('href').trim()
							: ''
						),
						time: time,
						srt: (Object.keys(result.places).length
							? Object.keys(result.places).length + 1
							: 0
						),
						common: false,
						geomark: true,
						userid: String(sessionStorage.getItem('places-userid')),
						images: {},
						type: 'place',
						added: true,
						deleted: false,
						updated: false,
						show: true,
					};
					result.waypoints.push(newWaypoint);
					result.places.push(newPlace);
				}
				result.tree = importedPlaceFolder.imported;
				return result;
			}
			function addImported(
				mime: string,
				parsed:
					Record<string,
						Array<Waypoint | Place | Folder> |
						Record<string, Array<Waypoint | Place> | Folder>
					> | null
			) {
				try {
					switch (mime) {
						case 'application/json' :
							let allParentsAdded = false;
							while (!allParentsAdded) {
								allParentsAdded = true;
								for (const folder of (parsed.folders as Array<Folder>)) {
									/*
									Checking if such a folder already exists in the tree
									and user has rights to add a folder.
									*/
									if (
										getters.treeFlat[folder.id] ||
										!getters.treeFlat[folder.parent] &&
										(parsed.folders as Array<Folder>)
											.find(f => f.id === folder.parent)
									) {
										continue;
									}
									if (
										state.serverConfig.rights.folderscount < 0 ||
										state.serverConfig.rights.folderscount
											// length - 1 because there is a root folder too
											> Object.keys(getters.treeFlat).length - 1 ||
										state.user.testaccount
									) {
										const newFolder: Folder = {
											type: 'folder',
											userid: sessionStorage.getItem('places-userid') as string,
											name: folder.name,
											description: folder.description,
											id: folder.id,
											srt: folder.srt,
											parent: folder.parent,
											opened: false,
											geomarks: 1,
											added: true,
											deleted: false,
											updated: false,
											builded: true,
										};
										dispatch('addFolder', newFolder);
									} else {
										dispatch('setMessage', `
											Превышено максимально допустимое для вашей
											текущей роли количство папок.
										`);
										break;
									}
									allParentsAdded = false;
								}
							}
							break;
						case 'application/gpx+xml' :
							dispatch('addFolder', parsed.tree);
							break;
						default :
							dispatch('setMessage', `
								Хм.
							`);
							return false;
					}
					for (const place of (parsed.places as Array<Place>)) {
						/*
						Checking if such a place already exists
						and user has rights to add a place.
						*/
						if (state.places[place.id]) continue;
						if (
							state.serverConfig.rights.placescount < 0 ||
							state.serverConfig.rights.placescount
								> Object.keys(state.places).length ||
							state.user.testaccount
						) {
							let newWaypoint: Waypoint;
							if (state.waypoints[place.waypoint]) {
								newWaypoint = state.waypoints[place.waypoint];
							} else {
								const parsedWaypoint =
									(parsed.waypoints as Array<Waypoint>)
										.find(w => w.id === place.waypoint)
								;
								newWaypoint = {
									id: parsedWaypoint.id,
									latitude: parsedWaypoint.latitude,
									longitude: parsedWaypoint.longitude,
									altitudecapability: parsedWaypoint.altitudecapability,
									time: parsedWaypoint.time,
									common: parsedWaypoint.common,
									type: 'waypoint',
									added: true,
									deleted: false,
									updated: false,
									show: true,
								};
							}
							const newPlace: Place = {
								type: 'place',
								userid: sessionStorage.getItem('places-userid') as string,
								name: place.name,
								description: place.description,
								waypoint: place.waypoint,
								link: place.link,
								time: place.time,
								id: place.id,
								folderid: place.folderid,
								srt: place.srt,
								common: place.common,
								geomark: true,
								added: true,
								deleted: false,
								updated: false,
								show: true,
							};
							dispatch('addPlace', {place: newPlace});
							if (!state.waypoints[place.waypoint]) {
								dispatch('addWaypoint', {
									waypoint: newWaypoint,
									from: newPlace,
								});
							}
						} else {
							dispatch('setMessage', `
								Превышено максимально допустимое для вашей
								текущей роли количство мест.
							`);
						}
					}
					bus.$emit('toDBCompletely');
				} catch (e) {
					dispatch('setMessage',
						'Ошибка при попытке импорта: ' + e
					);
					return false;
				}
				return true;
			}
			let parsed;
			switch (payload.mime) {
				case 'application/json' :
					parsed = parseJSON(payload.text);
					break;
				case 'application/gpx+xml' :
					parsed = parseGPX(payload.text);
					break;
				default :
					dispatch('setMessage', `
						Недопустимый тип импортируемого файла.
						Допускаются только JSON и GPX.
					`);
					return false;
			}
			addImported(payload.mime, parsed);
		},
		restoreObjectsAsLinks({state, commit}) {
			commit('setRefreshing', true);
			commit('setHomePlace', (state.user.homeplace
				? state.places[state.user.homeplace]
				: null
			));
			if (state.currentPlace) {
				let place: Place = null;
				if (state.commonPlaces[state.currentPlace.id])
					place = state.commonPlaces[state.currentPlace.id];
				if (state.places[state.currentPlace.id])
					place = state.places[state.currentPlace.id];
				commit('setCurrentPlace', place);
			}
			commit('setRefreshing', false);
		},
		async addFolder({commit, getters}, folder) {
			const parent = getters.treeFlat[folder.parent]
				? getters.treeFlat[folder.parent]
				: getters.tree
			;
			commit('addFolder', {folder: folder, parent: parent});
		},
		setHomePlace({state, commit}, id) {
			let place = null;
			if (state.places[id]) {
				place = state.places[id];
				bus.$emit('homeToDB', id);
			}
			commit('setHomePlace', place);
			if (!place) bus.$emit('homeToDB', null);
		},
		async deletePlacesMarkedAsDeleted({state, dispatch}) {
			const places: Record<string, Place> = {};
			for (const id in state.places) {
				if (state.places[id].deleted) {
					places[id] = state.places[id];
				}
			}
			await dispatch('deletePlaces', {places: places});
		},
		async deleteFoldersMarkedAsDeleted({dispatch, getters}) {
			const folders: Record<string, Folder> = {};
			for (const id in getters.treeFlat) {
				if (getters.treeFlat[id].deleted) {
					folders[id] = getters.treeFlat[id];
				}
			}
			await dispatch('deleteFolders', {folders: folders});
		},
		async deletePlaces({state, commit}, payload) {
			const
				saveToDB = 'todb' in payload && payload.todb === false ? false : true,
				waypoints: Array<Waypoint> = [],
				places: Array<Place> = [],
				images: Array<Image> = []
			;
			let commonWaypoint = false;
			for (const payloadPlaceId in payload.places) {
				for (const placeId in state.places) {
					if (
						placeId !== payloadPlaceId &&
						state.places[placeId].waypoint ===
							payload.places[payloadPlaceId].waypoint
					) {
						commonWaypoint = true;
						break;
					}
				}
				bus.$emit('deletePlace', payload.places[payloadPlaceId]);
				if (!commonWaypoint) {
					waypoints.push(
						state.waypoints[payload.places[payloadPlaceId].waypoint]
					);
					waypoints[waypoints.length - 1].deleted = true;
					commit('deleteWaypoint',
						state.waypoints[payload.places[payloadPlaceId].waypoint]
					);
				}
				places.push(payload.places[payloadPlaceId]);
				if (payload.places[payloadPlaceId].images) {
					for (const id in payload.places[payloadPlaceId].images) {
						images.push(payload.places[payloadPlaceId].images[id]);
					}
				}
				places[places.length - 1].deleted = true;
				commit('deletePlace', state.places[payloadPlaceId]);
				commonWaypoint = false;
			}
			if (saveToDB && !state.user.testaccount) {
				if (!state.inUndoRedo) {
					const data = new FormData();
					for (const image of images) {
						data.append('file_' + image.id, image.file);
					}
					data.append('userid', state.user.id);
					await axios.post('/backend/delete.php', data)
						.then(() => {
							bus.$emit('toDB', {what: 'images_delete', data: images});
						});
					bus.$emit('toDB', {what: 'waypoints', data: waypoints});
					bus.$emit('toDB', {what: 'places', data: places});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
		},
		async deleteFolders({state, commit, getters}, payload) {
			const
				saveToDB = 'todb' in payload && payload.todb === false ? false : true,
				folders: Array<Folder> = []
			;
			for (const payloadFolderId in payload.folders) {
				folders.push(payload.folders[payloadFolderId]);
				folders[folders.length - 1].deleted = true;
				if (getters.treeFlat[payloadFolderId]) {
					commit('deleteFolder', {folder: getters.treeFlat[payloadFolderId]});
				}
			}
			if (saveToDB && !state.user.testaccount) {
				if (!state.inUndoRedo) {
					bus.$emit('toDB', {what: 'folders', data: folders});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
		},
		async addWaypoint({state, commit}, payload) {
			const saveToDB = 'todb' in payload && payload.todb === false ? false : true;
			if (saveToDB && !state.user.testaccount) {
				if (!state.inUndoRedo) {
					bus.$emit('toDB', {
						what: 'waypoints',
						data: [{
							...payload.waypoint,
							from: (payload.from ? payload.from : null),
						}],
					});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
			commit('setObjectSaved', payload.waypoint);
			commit('addWaypoint', payload.waypoint);
		},
		async addPlace({state, commit}, payload) {
			const saveToDB = 'todb' in payload && payload.todb === false ? false : true;
			if (saveToDB && !state.user.testaccount) {
				if (!state.inUndoRedo) {
					bus.$emit('toDB', {what: 'places', data: [payload.place]});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
			commit('setObjectSaved', payload.place);
			commit('addPlace', payload.place);
		},
		async changeWaypoint({state, commit}, payload) {
			let saveToDB = 'todb' in payload && payload.todb === false ? false : true;
			for (const key in payload.change) {
				commit('changeWaypoint', {
					waypoint: payload.waypoint,
					key: key,
					value: payload.change[key],
				});
				if (
					key === 'added' ||
					key === 'deleted' ||
					key === 'updated'
				) {
					saveToDB = false;
				}
			}
			if (saveToDB && !state.user.testaccount) {
				commit('changeWaypoint', {
					waypoint: payload.waypoint,
					key: 'updated',
					value: true,
				});
				if (!state.inUndoRedo) {
					bus.$emit('toDB', {
						what: 'waypoints',
						data: [{
							...payload.waypoint,
							from: (payload.from ? payload.from : null),
						}],
					});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
		},
		async changePlace({state, commit, dispatch}, payload) {
			let saveToDB = 'todb' in payload && payload.todb === false ? false : true;
			if (
				'latitude' in payload.change ||
				'longitude' in payload.change ||
				'altitudecapability' in payload.change
			) {
				const
					lat = ('latitude' in payload.change
						? payload.change.latitude
						: state.waypoints[payload.place.waypoint].latitude
					),
					lng = ('longitude' in payload.change
						? payload.change.longitude
						: state.waypoints[payload.place.waypoint].longitude
					),
					alt = ('altitudecapability' in payload.change
						? payload.change.altitudecapability
						: ('altitudecapability' in state.waypoints[payload.place.waypoint]
							? state.waypoints[payload.place.waypoint].altitudecapability
							: null
						)
					)
				;
				dispatch('changeWaypoint', {
					waypoint: state.waypoints[payload.place.waypoint],
					change: {
						latitude: lat,
						longitude: lng,
						altitudecapability: alt,
					},
					from: payload.place,
				});
			}
			for (const key in payload.change) {
				if (
					key === 'latitude' ||
					key === 'longitude' ||
					key === 'altitudecapability'
				) {
					continue;
				}
				commit('changePlace', {
					place: payload.place,
					key: key,
					value: payload.change[key],
				});
				if (
					key === 'added' ||
					key === 'deleted' ||
					key === 'updated'
				) {
					saveToDB = false;
				}
			}
			if (saveToDB && !state.user.testaccount) {
				commit('changePlace', {
					place: payload.place,
					key: 'updated',
					value: true,
				});
				if (!state.inUndoRedo) {
					bus.$emit('toDB', {what: 'places', data: [payload.place]});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
		},
		changeFolder({state, commit}, payload) {
			let saveToDB = 'todb' in payload && payload.todb === false ? false : true;
			for (const key in payload.change) {
				commit('changeFolder', {
					folder: payload.folder,
					key: key,
					value: payload.change[key],
				});
				if (
					key === 'added' ||
					key === 'deleted' ||
					key === 'updated'
				) {
					saveToDB = false;
				}
			}
			if (saveToDB && !state.user.testaccount) {
				commit('changeFolder', {
					folder: payload.folder,
					key: 'updated',
					value: true,
				});
				if (!state.inUndoRedo) {
					bus.$emit('toDB', {what: 'folders', data: [payload.folder]});
				} else {
					bus.$emit('toDBCompletely');
					commit('outUndoRedo');
				}
			}
		},
		async moveFolder({commit, dispatch, getters}, payload) {
			let source;
			const folder = ('folder' in payload)
				? payload.folder
				: getters.treeFlat[payload.folderId]
			;
			if (folder.parent === 'root') {
				source = getters.tree;
			} else {
				source = getters.treeFlat[folder.parent];
			}
			const target = ('target' in payload)
				? payload.target
				: getters.treeFlat[payload.targetId]
			;
			const srt = (
				('srt' in payload) ? payload.srt : (
					Object.keys(target.children).length
						? target.children[
							Object.keys(target.children)[
								Object.keys(target.children).length - 1
							]
						].srt + 1
						: 1
				)
			);
			if (target !== source) {
				commit('addFolder', {folder: folder, parent: target});
				commit('deleteFolder', {folder: folder, source: source});
			}
			const changeFolderPayload = {
				folder: folder,
				change: {
					parent: target.id,
					srt: srt,
					updated: false,
				},
				todb: true,
			};
			if ('todb' in payload && payload.todb === false) {
				changeFolderPayload.todb = false;
				changeFolderPayload.change.updated = true;
			}
			await dispatch('changeFolder', changeFolderPayload);
		},
		savedToDB({state, commit, getters}, payload) {
			switch (payload.what) {
				case 'waypoints' :
					if (payload.data) {
						for (const waypoint of payload.data) {
							commit('setObjectSaved', waypoint);
						}
					} else {
						for (const id in state.waypoints) {
							commit('setObjectSaved', state.waypoints[id]);
						}
					}
					break;
				case 'places' :
					if (payload.data) {
						for (const place of payload.data) {
							commit('setObjectSaved', place);
						}
					} else {
						for (const id in state.places) {
							commit('setObjectSaved', state.places[id]);
						}
					}
					break;
				case 'folders' :
					if (payload.data) {
						for (const folder of payload.data) {
							commit('setObjectSaved', folder);
						}
					} else {
						for (const id in getters.treeFlat) {
							commit('setObjectSaved', getters.treeFlat[id]);
						}
					}
					break;
				default :
					if (payload.data) {
						for (const waypoint of payload.data) {
							commit('setObjectSaved', waypoint);
						}
						for (const place of payload.data) {
							commit('setObjectSaved', place);
						}
						for (const folder of payload.data) {
							commit('setObjectSaved', folder);
						}
					} else {
						for (const id in state.waypoints) {
							commit('setObjectSaved', state.waypoints[id]);
						}
						for (const id in state.places) {
							commit('setObjectSaved', state.places[id]);
						}
						for (const id in getters.treeFlat) {
							commit('setObjectSaved', getters.treeFlat[id]);
						}
					}
					
			}
			commit('setSaved');
		},
		folderOpenClose({commit}, payload) {
			if (payload.folder) {
				commit('folderOpenClose', payload);
			}
			if (payload.target) {
				if (payload.opened) {
					payload.target.classList.add('folder_opened');
				} else {
					if (payload.target.classList.contains('folder_opened')) {
						payload.target.classList.add('folder_closed');
						payload.target.classList.remove('folder_opened');
					} else {
						payload.target.classList.add('folder_opened');
						payload.target.classList.remove('folder_closed');
					}
				}
			}
		},
		swapImages({commit}, payload) {
			commit('swapImages', payload);
		},
		changeMap({commit}, payload) {
			commit('changeMap', payload);
		},
		placemarksShowHide({state, commit}, show) {
			commit('placemarksShowHide', show === undefined ? !state.placemarksShow : show);
		},
		commonPlacemarksShowHide({state, commit}, show) {
			commit('commonPlacemarksShowHide', show === undefined ? !state.commonPlacemarksShow : show);
		},
		centerPlacemarkShowHide({state, commit}, show) {
			commit('centerPlacemarkShowHide', show === undefined ? !state.centerPlacemarkShow : show);
		},
		setMessage({state, commit, dispatch}, message: string) {
			message = message.replace(/[\t\n]/g, ' ');
			message = message.replace(/[ ]{2,}/g, ' ').trim();
			const messagesContainer = document.getElementById('messages');
			if (messagesContainer) {
				messagesContainer.classList.remove('invisible');
				messagesContainer.classList.add('visible');
			}
			const messageIndex = state.messages.indexOf(message);
			if (messageIndex !== -1) {
				const messageContainer = document.getElementById('message-' + messageIndex);
				if (messageContainer) {
					messageContainer.classList.add('highlight');
					window.setTimeout(() => {
						messageContainer.classList.remove('highlight');
					}, 500);
				}
			} else {
				commit('setMessage', message);
			}
			if (state.messageTimer) {
				clearInterval(state.messageTimer);
			}
			commit(
				'setMessageTimer',
				window.setInterval(() => {
					if (!state.mouseOverMessages) {
						if (state.messages.length === 1) {
							dispatch('clearMessages');
						}
						window.setTimeout(function() {
							commit(
								'deleteMessage',
								state.messages[state.messages.length - 1]
							);
						}, 500);
					}
				}, 3000)
			);
		},
		clearMessages({state, commit}) {
			clearInterval(state.messageTimer);
			const messagesContainer = document.getElementById('messages');
			if (messagesContainer) {
				messagesContainer.classList.remove('visible');
				messagesContainer.classList.add('invisible');
			}
			window.setTimeout(function() {
				commit('clearMessages');
			}, 500);
		},
	},
	getters: {
		tree(state) {
			Vue.set(state.rootPlace, 'children', state.folders);
			Vue.set(state.rootPlace, 'userid', (state.user ? state.user.id : null));
			return state.rootPlace;
		},
		treeFlat(state, getters) {
			const treeFlat: Record<string, Folder> = {};
			commonFunctions.treeToLivePlain(getters.tree, 'children', treeFlat);
			return treeFlat;
		},
	},
});

export default store;

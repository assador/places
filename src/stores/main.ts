import { defineStore } from 'pinia';
import { Waypoint, Place, Folder, Image, User } from './types';
import { constants } from '@/shared/constants';
import { emitter } from '@/shared/bus';
import {
	generateRandomString,
	num2deg,
	treeToLivePlain,
	plainToTree,
	formFolderForImported,
	distanceOnSphere,
} from '@/shared/common';
import axios from 'axios';

export interface IMainState {
	refreshing: boolean,
	saved: boolean,
	idleTime: number,
	stateBackups: any[],
	stateBackupsIndex: number,
	inUndoRedo: boolean,
	user: User | null,
	currentPlace: Place | null,
	homePlace: Place | null,
	rangeShow: boolean,
	range: number | null,
	measure: {
		places: (string | null)[],
		choosing: number | null,
		distance: number,
		show: boolean,
	},
	waypoints: Record<string, Waypoint> | null,
	places: Record<string, Place>,
	folders: Record<string, Folder>,
	commonPlaces: Record<string, Place>,
	center: Record<string, number>,
	zoom: number,
	placemarksShow: boolean,
	commonPlacemarksShow: boolean,
	centerPlacemarkShow: boolean,
	ready: boolean,
	messages: string[],
	messageTimer: number,
	mouseOverMessages: boolean,
	serverConfig: any | null,
	activeMapIndex: number,
	lang: string,
	langs: Record<string, string>[],
	colortheme: string,
	t: any,
	tree: Folder,
}

export const useMainStore = defineStore('main', {
	state: (): IMainState => ({
		refreshing: false,
		saved: true,
		idleTime: 0,
		stateBackups: [],
		stateBackupsIndex: -1,
		inUndoRedo: false,
		user: null,
		currentPlace: null,
		homePlace: null,
		rangeShow: false,
		range: null,
		measure: {
			places: [null, null],
			distance: 0,
			choosing: null,
			show: false,
		},
		waypoints: {},
		places: {},
		folders: {},
		commonPlaces: {},
		center: {
			latitude: Number(constants.map.initial.latitude),
			longitude: Number(constants.map.initial.longitude),
		},
		zoom: Number(constants.map.initial.zoom),
		placemarksShow: true,
		commonPlacemarksShow: false,
		centerPlacemarkShow: false,
		ready: false,
		messages: [],
		messageTimer: 0,
		mouseOverMessages: false,
		serverConfig: null,
		activeMapIndex: 0,
		lang: 'ru',
		langs: [{
			value: 'ru',
			title: 'Русский',
		}, {
			value: 'en',
			title: 'English',
		}],
		colortheme: 'brown',
		t: {},
		tree: {
			id: 'root',
			parent: null,
			srt: 0,
			geomarks: 1,
			type: 'folder',
			added: false,
			deleted: false,
			updated: false,
			opened: true,
			builded: true,
			name: '',
			userid: '',
			children: {},
		},
	}),
	actions: {
		changeLangMut(payload) {
			this.lang = payload.lang;
			this.t = payload.dict;
			this.tree.name = this.t.i.captions.rootFolder;
		},
		changeMapMut(index) {
			this.activeMapIndex = index;
		},
		changeColorThemeMut(colortheme) {
			this.colortheme = colortheme;
		},
		setMessageMut(message) {
			this.messages.push(message);
		},
		clearMessagesMut() {
			this.messages = [];
		},
		deleteMessage(index) {
			this.messages.splice(index, 1);
		},
		setMouseOverMessages(over) {
			this.mouseOverMessages = (over === false ? false : true);
		},
		setRefreshing(refreshing) {
			this.refreshing = refreshing;
		},
		setSaved(saved) {
			this.saved = (saved === false ? false : true);
		},
		setObjectSaved(object) {
			object.added = false;
			object.deleted = false;
			object.updated = false;
		},
		setIdleTime(time) {
			this.idleTime = time;
		},
		backupState() {
			if (this.stateBackups) {
				if (this.stateBackups.length === constants.backupscount) return;
				this.stateBackups.splice(++this.stateBackupsIndex);
				this.stateBackups.push(
					Object.assign({}, JSON.parse(JSON.stringify(this.$state)))
				);
				delete this.stateBackups[this.stateBackups.length - 1].stateBackups
			}
		},
		restoreStateMut(index) {
			if (this.stateBackups) {
				for (const key in Object(this.stateBackups[index])) {
					if (
						key !== 'stateBackups' &&
						key !== 'placeFields' &&
						key !== 'treeFlat'
					) {
						this[key] =
							JSON.parse(
								JSON.stringify(
									this.stateBackups[index][key]
								)
							)
						;
					}
				}
			}
		},
		stateBackupsIndexChange(delta) {
			this.stateBackupsIndex = this.stateBackupsIndex + delta;
		},
		reset() {
			this.saved = true;
			this.idleTime = 0;
			this.stateBackups = [];
			this.stateBackupsIndex = -1;
			this.inUndoRedo = false;
			this.user = null;
			this.currentPlace = null;
			this.homePlace = null;
			this.waypoints = {};
			this.places = {};
			this.folders = {};
			this.commonPlaces = {};
			this.center = {
				latitude: Number(constants.map.initial.latitude),
				longitude: Number(constants.map.initial.longitude),
			};
			this.zoom = Number(constants.map.initial.zoom);
			this.placemarksShow = true;
			this.commonPlacemarksShow = false;
			this.centerPlacemarkShow = false;
			this.ready = false;
			this.messages = [];
			this.messageTimer = 0;
			this.mouseOverMessages = false;
			this.serverConfig = null;
		},
		setUserMut(user) {
			this.user = user;
		},
		setServerConfigMut(config) {
			this.serverConfig = config;
		},
		setCurrentPlace(place) {
			this.currentPlace = place;
		},
		setHomePlaceMut(place) {
			this.homePlace = place;
			if (this.user) {
				this.user.homeplace = !place ? null : place.id;
			}
		},
		placesReady(payload) {
			if (payload.waypoints) {
				this.waypoints = payload.waypoints;
			}
			if (payload.places) {
				this.places = payload.places;
			}
			if (payload.commonPlaces) {
				this.commonPlaces = payload.commonPlaces;
			}
			if (payload.folders) {
				this.folders = payload.folders;
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
				payload.waypoints[id].type = 'waypoint';
				payload.waypoints[id].added = added;
				payload.waypoints[id].deleted = deleted;
				payload.waypoints[id].updated = updated;
				payload.waypoints[id].show = true;
			}
			for (const id in payload.places) {
				payload.places[id].type = 'place';
				payload.places[id].added = added;
				payload.places[id].deleted = deleted;
				payload.places[id].updated = updated;
				payload.places[id].show = true;
			}
			for (const id in payload.folders) {
				payload.folders[id].type = 'folder';
				payload.folders[id].added = added;
				payload.folders[id].deleted = deleted;
				payload.folders[id].updated = updated;
				payload.folders[id].opened = false;
			}
			this.folders = plainToTree(this.folders);
			this.tree.name = this.t.i.captions.rootFolder;
			this.tree.userid = this.user ? this.user.id : null;
			this.tree.children = this.folders;
		},
		stateReady(ready) {
			this.ready = ready;
		},
		replaceStateMut(newState) {
			for (const prop in newState) {
				this[prop] = newState[prop];
			}
		},
		show(id) {
			this.places[id].show = true;
		},
		hide(id) {
			this.places[id].show = false;
		},
		modifyPlaces(places) {
			this.places = places;
		},
		modifyFolders(folders) {
			this.folders = folders;
		},
		modifyCommonPlaces(commonPlaces) {
			this.commonPlaces = commonPlaces;
		},
		addWaypointMut(waypoint) {
			this.waypoints[waypoint.id] = waypoint;
		},
		addPlaceMut(place) {
			this.places[place.id] = place;
		},
		deleteWaypoint(waypoint) {
			delete this.waypoints[waypoint.id];
		},
		deletePlace(place) {
			delete this.places[place.id];
		},
		addFolderMut(payload) {
			if (!payload.parent) {
				this.folders[payload.folder.id] = payload.folder;
			} else {
				if (!payload.parent.children) {
					payload.parent.children = {};
				} else {
					payload.parent.needToRefreshTreeSorry = null;
					delete payload.parent.needToRefreshTreeSorry;
				}
				payload.parent.children[payload.folder.id] = payload.folder;
			}
		},
		deleteFolder(payload) {
			if (!payload.source) {
				payload.source = this.treeFlat[payload.folder.parent];
			}
			delete payload.source.children[payload.folder.id];
			payload.source.needToRefreshTreeSorry = null;
			delete payload.source.needToRefreshTreeSorry;
		},
		changeWaypointMut(payload) {
			payload.waypoint[payload.key] = payload.value;
		},
		changePlaceMut(payload) {
			payload.place[payload.key] = payload.value;
		},
		changeFolderMut(payload) {
			payload.folder[payload.key] = payload.value;
		},
		deleteImages(payload) {
			if (!payload.images || !Object.keys(payload.images).length) return;
			for (const id in payload.images) {
				if (
					this.places[payload.images[id].placeid] &&
					this.places[payload.images[id].placeid].images[id]
				) {
					delete this.places[payload.images[id].placeid].images[id];
				}
			}
		},
		folderOpenCloseMut(payload) {
			payload.folder.opened =
				payload.hasOwnProperty('opened')
					? payload.opened
					: !payload.folder.opened
			;
		},
		swapImagesMut(changes) {
			changes.place.images[changes.ids[0]].srt =
				[
					changes.place.images[changes.ids[1]].srt,
					changes.place.images[changes.ids[1]].srt =
						changes.place.images[changes.ids[0]].srt
				][0]
			;
			changes.place.updated = true;
		},
		updateMapMut(payload) {
			if (typeof payload.latitude === 'number') {
				this.center.latitude = payload.latitude;
			}
			if (typeof payload.longitude === 'number') {
				this.center.longitude = payload.longitude;
			}
			if (typeof payload.zoom === 'number') {
				this.zoom = payload.zoom;
			}
		},
		placemarksShowHideMut(show) {
			this.placemarksShow = show;
		},
		commonPlacemarksShowHideMut(show) {
			this.commonPlacemarksShow = show;
		},
		centerPlacemarkShowHideMut(show) {
			this.centerPlacemarkShow = show;
		},
		showInRange(range: number | null) {
			if (range <= 0 || range === null) {
				for (const id in this.places) this.places[id].show = true;
				return;
			}
			for (const id in this.places) {
				if (distanceOnSphere(
					this.waypoints[this.places[id].waypoint].latitude,
					this.waypoints[this.places[id].waypoint].longitude,
					this.waypoints[this.currentPlace.waypoint].latitude,
					this.waypoints[this.currentPlace.waypoint].longitude,
					constants.earthRadius
				) > range) {
					this.places[id].show = false;
				} else {
					this.places[id].show = true;
				}
			}
		},
		measureDistance() {
			let lastIdx: number | null = null;
			this.measure.distance = 0;
			if (this.measure.places.length < 2) return;
			for (let i = 0; i < this.measure.places.length; i++) {
				if (this.measure.places[i] === null) continue;
				if (lastIdx === null) {
					lastIdx = i;
					continue;
				}
				this.measure.distance += distanceOnSphere(
					this.waypoints[this.places[this.measure.places[lastIdx]].waypoint].latitude,
					this.waypoints[this.places[this.measure.places[lastIdx]].waypoint].longitude,
					this.waypoints[this.places[this.measure.places[i]].waypoint].latitude,
					this.waypoints[this.places[this.measure.places[i]].waypoint].longitude,
					constants.earthRadius
				);
				lastIdx = i;
			}
		},
		showHidePlaceGeomark(payload) {
			payload.place.geomark = payload.show;
		},
		showHideFolderGeomarks(payload) {
			payload.folder.geomarks = payload.show;
		},
		setMessageTimer(messageTimer) {
			this.messageTimer = messageTimer;
		},
		changeLang(lang) {
			const getLang = () => import(`@/lang/${lang}.ts`);
			getLang().then(l => {
				this.changeLangMut({lang: lang, dict: l.t});
			});
		},
		changeMap(index) {
			this.changeMapMut(index);
		},
		changeColorTheme(colortheme) {
			this.changeColorThemeMut(colortheme);
		},
		restoreState(backupIndex) {
			this.restoreStateMut(backupIndex);
			this.restoreObjectsAsLinks()
				.then(() => {
					emitter.emit('refreshMapOpenStreetMapMarks');
					emitter.emit('refreshMapYandexMarks');
				});
		},
		undo() {
			if (this.stateBackupsIndex > 0) {
				this.stateBackupsIndexChange(-1);
				this.restoreStateMut(this.stateBackupsIndex);
				this.inUndoRedo = true;
				this.setSaved(false);
			}
		},
		redo() {
			if (
				this.stateBackups &&
				this.stateBackupsIndex < this.stateBackups.length - 1
			) {
				this.stateBackupsIndexChange(1);
				this.restoreStateMut(this.stateBackupsIndex);
				if (this.stateBackupsIndex === this.stateBackups.length - 1) {
					this.outUndoRedo = false;
					this.setSaved(true);
				}
			}
		},
		unload() {
			this.refreshing = true;
			this.reset();
			sessionStorage.clear();
		},
		async setUser() {
			return axios
				.get(
					'/backend/get_account.php?id=' +
					sessionStorage.getItem('places-userid')
				)
				.then(response => {
					this.setUserMut(response.data);
					this.setServerConfig();
				})
				.catch(e => {
					console.error(e);
					this.setMessage(this.t.m.popup.cannotGetData);
					this.setUserMut(null);
				})
			;
		},
		async setServerConfig() {
			return axios
				.get(
					'/backend/get_config.php?userid=' +
					sessionStorage.getItem('places-userid')
				)
				.then(response => {
					this.setServerConfigMut(response.data);
				})
				.catch(e => {
					console.error(e);
					this.setMessage(this.t.m.popup.cannotGetData);
					this.setServerConfigMut(null);
				})
			;
		},
		async setPlaces(payload) {
			this.stateReady(false);
			// If reading from database, not importing
			if (!payload) {
				return axios
					.get(
						'/backend/get_places.php?id=' +
						sessionStorage.getItem('places-userid')
					)
					.then(response => {
						this.placesReady({
							waypoints: Object.assign({}, response.data.waypoints),
							places: Object.assign({}, response.data.places),
							commonPlaces: Object.assign({}, response.data.common_places),
							folders: Object.assign({}, response.data.folders),
						});
						this.setHomePlaceMut((this.user.homeplace
							? this.places[this.user.homeplace]
							: null
						));
						this.stateReady(true);
					})
					.catch(e => {
						console.error(e);
						this.setMessage(
							this.t.m.popup.cannotGetDataFromDb
						);
						this.placesReady({
							waypoints: {},
							places: {},
							commonPlaces: {},
							folders: {},
						});
					})
				;
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
						JSON.parse(text)
					;
					return result;
				} catch (e) {
					console.error(e);
					this.setMessage(
						this.t.m.popup.parsingImportError + ': ' + e
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
					console.error(e);
					this.setMessage(
						this.t.m.popup.parsingImportError + ': ' + e
					);
					return null;
				}
				if (this.treeFlat.imported) {
					result.tree = this.treeFlat.imported;
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
					importedPlaceFolder = formFolderForImported(
						this.t,
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
												new RegExp(reStr, 'i'), '$1'
											) + (desc.nextSibling ? '\n' : '');
										}
										break;
								}
							} catch (e) {console.error(e);}
						}
					}
					// Forming an importing place as an object and pushing it in a structure
					const newWaypointId = generateRandomString(32);
					const newPlaceId = generateRandomString(32);
					const newWaypoint = {
						id: newWaypointId,
						latitude:
							Number(wpt.getAttribute('lat')) ||
							Number(constants.map.initial.latitude) ||
							null,
						longitude:
							Number(wpt.getAttribute('lon')) ||
							Number(constants.map.initial.longitude) ||
							null,
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
										this.treeFlat[folder.id] ||
										!this.treeFlat[folder.parent] &&
										(parsed.folders as Array<Folder>)
											.find(f => f.id === folder.parent)
									) {
										continue;
									}
									if (
										this.serverConfig.rights.folderscount < 0 ||
										this.serverConfig.rights.folderscount
											// length - 1 because there is a root folder too
											> Object.keys(this.treeFlat).length - 1 ||
										this.user.testaccount
									) {
										const newFolder: Folder = {
											type: 'folder',
											userid: sessionStorage.getItem('places-userid') as string,
											name: folder.name,
											description: folder.description,
											id: folder.id,
											srt: Number(folder.srt) || 0,
											parent: folder.parent,
											opened: false,
											geomarks: 1,
											added: true,
											deleted: false,
											updated: false,
											builded: true,
										};
										this.addFolder({folder: newFolder});
									} else {
										this.setMessage(
											this.t.m.popup.foldersCountExceeded
										);
										break;
									}
									allParentsAdded = false;
								}
							}
							break;
						case 'application/gpx+xml' :
							this.addFolder({folder: parsed.tree});
							break;
						default :
							this.setMessage(`
								o_O
							`);
							return false;
					}
					for (const place of (parsed.places as Array<Place>)) {
						/*
						Checking if such a place already exists
						and user has rights to add a place.
						*/
						if (this.places[place.id]) continue;
						if (
							this.serverConfig.rights.placescount < 0 ||
							this.serverConfig.rights.placescount
								> Object.keys(this.places).length ||
							this.user.testaccount
						) {
							let newWaypoint: Waypoint;
							if (this.waypoints[place.waypoint]) {
								newWaypoint = this.waypoints[place.waypoint];
							} else {
								const parsedWaypoint =
									(parsed.waypoints as Array<Waypoint>)
										.find(w => w.id === place.waypoint)
								;
								newWaypoint = {
									id: parsedWaypoint.id,
									latitude:
										Number(parsedWaypoint.latitude) ||
										Number(constants.map.initial.latitude) ||
										null,
									longitude:
										Number(parsedWaypoint.longitude) ||
										Number(constants.map.initial.longitude) ||
										null,
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
								srt: Number(place.srt) || 0,
								common: place.common,
								geomark: true,
								added: true,
								deleted: false,
								updated: false,
								show: true,
							};
							this.addPlace({place: newPlace});
							if (!this.waypoints[place.waypoint]) {
								this.addWaypoint({
									waypoint: newWaypoint,
									from: newPlace,
								});
							}
						} else {
							this.setMessage(
								this.t.m.popup.placesCountExceeded
							);
						}
					}
					emitter.emit('toDBCompletely');
				} catch (e) {
					console.error(e);
					this.setMessage(
						this.t.m.popup.parsingImportError + ': ' + e
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
					this.setMessage(
						this.t.m.popup.invalidImportFileType
					);
					return false;
			}
			addImported(payload.mime, parsed);
		},
		async replaceState(payload) {
			this.replaceStateMut(payload.state);
			this.changeLang(this.lang);
			await this.restoreObjectsAsLinks();
			if (this.currentPlace) {
				this.updateMap({
					latitude: this.waypoints[this.currentPlace.waypoint].latitude,
					longitude: this.waypoints[this.currentPlace.waypoint].longitude,
				});
			}
		},
		restoreObjectsAsLinks() {
			this.setRefreshing(true);
			this.setHomePlaceMut((this.user.homeplace
				? this.places[this.user.homeplace]
				: null
			));
			if (this.currentPlace) {
				let place: Place = null;
				if (this.commonPlaces[this.currentPlace.id])
					place = this.commonPlaces[this.currentPlace.id];
				if (this.places[this.currentPlace.id])
					place = this.places[this.currentPlace.id];
				this.setCurrentPlace(place);
			}
			this.setRefreshing(false);
		},
		async addFolder(payload) {
			this.backupState();
			const parent = this.treeFlat[payload.folder.parent]
				? this.treeFlat[payload.folder.parent]
				: this.tree
			;
			const saveToDB = ('todb' in payload && payload.todb === false ? false : true);
			if (saveToDB && !this.user.testaccount) {
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {what: 'folders', data: [payload.folder]});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
			this.setObjectSaved(payload.folder);
			this.addFolderMut({folder: payload.folder, parent: parent});
		},
		setHomePlace(id) {
			this.backupState();
			let place = null;
			if (this.places[id]) {
				place = this.places[id];
				emitter.emit('homeToDB', id);
			}
			this.setHomePlaceMut(place);
			if (!place) emitter.emit('homeToDB', null);
		},
		deletePlacesMarkedAsDeleted() {
			const places: Record<string, Place> = {};
			for (const id in this.places) {
				if (this.places[id].deleted) {
					places[id] = this.places[id];
				}
			}
			this.deletePlaces({places: places});
		},
		deleteFoldersMarkedAsDeleted() {
			const folders: Record<string, Folder> = {};
			for (const id in this.treeFlat) {
				if (this.treeFlat[id].deleted) {
					folders[id] = this.treeFlat[id];
				}
			}
			this.deleteFolders({folders: folders});
		},
		async deletePlaces(payload) {
			this.backupState();
			const
				saveToDB = ('todb' in payload && payload.todb === false ? false : true),
				waypoints: Array<Waypoint> = [],
				places: Array<Place> = [],
				images: Array<Image> = []
			;
			let commonWaypoint = false;
			for (const payloadPlaceId in payload.places) {
				for (const placeId in this.places) {
					if (
						placeId !== payloadPlaceId &&
						this.places[placeId].waypoint ===
							payload.places[payloadPlaceId].waypoint
					) {
						commonWaypoint = true;
						break;
					}
				}
				if (!commonWaypoint) {
					waypoints.push(
						this.waypoints[payload.places[payloadPlaceId].waypoint]
					);
					waypoints[waypoints.length - 1].deleted = true;
					this.deleteWaypoint(
						this.waypoints[payload.places[payloadPlaceId].waypoint]
					);
				}
				places.push(payload.places[payloadPlaceId]);
				if (payload.places[payloadPlaceId].images) {
					for (const id in payload.places[payloadPlaceId].images) {
						images.push(payload.places[payloadPlaceId].images[id]);
					}
				}
				places[places.length - 1].deleted = true;
				this.deletePlace(this.places[payloadPlaceId]);
				emitter.emit('deletePlace', payload.places[payloadPlaceId]);
				commonWaypoint = false;
			}
			if (saveToDB && !this.user.testaccount) {
				if (!this.inUndoRedo) {
					const data = new FormData();
					for (const image of images) {
						data.append('file_' + image.id, image.file);
					}
					data.append('userid', this.user.id);
					await axios.post('/backend/delete.php', data)
						.then(() => {
							emitter.emit('toDB', {what: 'images_delete', data: images});
						});
					emitter.emit('toDB', {what: 'waypoints', data: waypoints});
					emitter.emit('toDB', {what: 'places', data: places});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
		},
		async deleteFolders(payload) {
			this.backupState();
			const
				saveToDB = ('todb' in payload && payload.todb === false ? false : true),
				folders: Array<Folder> = []
			;
			for (const payloadFolderId in payload.folders) {
				folders.push(payload.folders[payloadFolderId]);
				folders[folders.length - 1].deleted = true;
				if (this.treeFlat[payloadFolderId]) {
					this.deleteFolder({folder: this.treeFlat[payloadFolderId]});
				}
			}
			if (saveToDB && !this.user.testaccount) {
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {what: 'folders', data: folders});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
		},
		async addWaypoint(payload) {
			const saveToDB = ('todb' in payload && payload.todb === false ? false : true);
			if (saveToDB && !this.user.testaccount) {
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {
						what: 'waypoints',
						data: [{
							...payload.waypoint,
							from: (payload.from ? payload.from : null),
						}],
					});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
			this.setObjectSaved(payload.waypoint);
			this.addWaypointMut(payload.waypoint);
		},
		async addPlace(payload) {
			this.backupState();
			const saveToDB = ('todb' in payload && payload.todb === false ? false : true);
			if (saveToDB && !this.user.testaccount) {
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {what: 'places', data: [payload.place]});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
			this.setObjectSaved(payload.place);
			this.addPlaceMut(payload.place);
		},
		async changeWaypoint(payload) {
			let saveToDB = ('todb' in payload && payload.todb === false ? false : true);
			for (const key in payload.change) {
				this.changeWaypointMut({
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
			if (saveToDB && !this.user.testaccount) {
				this.changeWaypointMut({
					waypoint: payload.waypoint,
					key: 'updated',
					value: true,
				});
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {
						what: 'waypoints',
						data: [{
							...payload.waypoint,
							from: (payload.from ? payload.from : null),
						}],
					});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
		},
		async changePlace(payload) {
			this.backupState();
			let saveToDB = ('todb' in payload && payload.todb === false ? false : true);
			if ('latitude' in payload.change || 'longitude' in payload.change) {
				const
					lat = num2deg(('latitude' in payload.change
						? payload.change.latitude
						: this.waypoints[payload.place.waypoint].latitude
					), true),
					lng = num2deg(('longitude' in payload.change
						? payload.change.longitude
						: this.waypoints[payload.place.waypoint].longitude
					))
				;
				this.changeWaypoint({
					waypoint: this.waypoints[payload.place.waypoint],
					change: {
						latitude: Number(lat),
						longitude: Number(lng),
					},
					from: payload.place,
				});
			}
			for (const key in payload.change) {
				if (key === 'latitude' || key === 'longitude') continue;
				this.changePlaceMut({
					place: payload.place,
					key: key,
					value: key === 'srt'
						? (Number(payload.change[key]) || 0)
						: payload.change[key],
				});
				if (
					key === 'added' ||
					key === 'deleted' ||
					key === 'updated'
				) {
					saveToDB = false;
				}
			}
			if (saveToDB && !this.user.testaccount) {
				this.changePlaceMut({
					place: payload.place,
					key: 'updated',
					value: true,
				});
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {what: 'places', data: [payload.place]});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
		},
		changeFolder(payload) {
			this.backupState();
			for (const key in payload.change) {
				this.changeFolderMut({
					folder: payload.folder,
					key: key,
					value: payload.change[key],
				});
			}
			const saveToDB = ('todb' in payload && payload.todb === false ? false : true);
			if (saveToDB && !this.user.testaccount) {
				this.changeFolderMut({
					folder: payload.folder,
					key: 'updated',
					value: true,
				});
				if (!this.inUndoRedo) {
					emitter.emit('toDB', {what: 'folders', data: [payload.folder]});
				} else {
					emitter.emit('toDBCompletely');
					this.outUndoRedo = false;
				}
			}
		},
		moveFolder(payload) {
			let source;
			const folder = ('folder' in payload)
				? payload.folder
				: this.treeFlat[payload.folderId]
			;
			if (folder.parent === 'root') {
				source = this.tree;
			} else {
				source = this.treeFlat[folder.parent];
			}
			const target = ('target' in payload)
				? payload.target
				: this.treeFlat[payload.targetId]
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
				this.addFolderMut({folder: folder, parent: target});
				this.deleteFolder({folder: folder, source: source});
			}
			const changeFolderPayload = {
				folder: folder,
				change: {
					parent: target.id,
					srt: Number(srt) || 0,
					updated: false,
				},
				todb: true,
			};
			if ('todb' in payload && payload.todb === false) {
				changeFolderPayload.todb = false;
				changeFolderPayload.change.updated = true;
			}
			this.changeFolder(changeFolderPayload);
		},
		savedToDB(payload) {
			switch (payload.what) {
				case 'waypoints' :
					if (payload.data) {
						for (const waypoint of payload.data) {
							this.setObjectSaved(waypoint);
						}
					} else {
						for (const id in this.waypoints) {
							this.setObjectSaved(this.waypoints[id]);
						}
					}
					break;
				case 'places' :
					if (payload.data) {
						for (const place of payload.data) {
							this.setObjectSaved(place);
						}
					} else {
						for (const id in this.places) {
							this.setObjectSaved(this.places[id]);
						}
					}
					break;
				case 'folders' :
					if (payload.data) {
						for (const folder of payload.data) {
							this.setObjectSaved(folder);
						}
					} else {
						for (const id in this.treeFlat) {
							this.setObjectSaved(this.treeFlat[id]);
						}
					}
					break;
				default :
					if (payload.data) {
						for (const waypoint of payload.data) {
							this.setObjectSaved(waypoint);
						}
						for (const place of payload.data) {
							this.setObjectSaved(place);
						}
						for (const folder of payload.data) {
							this.setObjectSaved(folder);
						}
					} else {
						for (const id in this.waypoints) {
							this.setObjectSaved(this.waypoints[id]);
						}
						for (const id in this.places) {
							this.setObjectSaved(this.places[id]);
						}
						for (const id in this.treeFlat) {
							this.setObjectSaved(this.treeFlat[id]);
						}
					}
	
			}
			this.setSaved();
		},
		folderOpenClose(payload) {
			if (payload.folder) {
				this.folderOpenCloseMut(payload);
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
		swapImages(payload) {
			this.swapImagesMut(payload);
		},
		updateMap(payload) {
			this.updateMapMut(payload);
		},
		placemarksShowHide(show?) {
			this.placemarksShowHideMut(
				show === undefined ? !this.placemarksShow : show
			);
		},
		commonPlacemarksShowHide(show?) {
			this.commonPlacemarksShowHideMut(
				show === undefined ? !this.commonPlacemarksShow : show
			);
		},
		centerPlacemarkShowHide(show?) {
			this.centerPlacemarkShowHideMut(
				show === undefined ? !this.centerPlacemarkShow : show
			);
		},
		showHideGeomarks(payload) {
			let visibility: number;
			const showHideSubGeomarks = (object: any, show: number | boolean) => {
				if (object.type === 'place') {
					this.showHidePlaceGeomark({
						place: object,
						show: !show ? false : true,
					});
					return;
				}
				this.showHideFolderGeomarks({
					folder: object,
					show: !show ? 0 : 1,
				});
				for (const id in this.places) {
					if (this.places[id].folderid === object.id) {
						this.showHidePlaceGeomark({
							place: this.places[id],
							show: show,
						});
					}
				}
				if (object.children && Object.keys(object.children).length) {
					for (const id in object.children) {
						showHideSubGeomarks(object.children[id], show);
					}
				}
			}
			const showHideParentsGeomarks = (object: any) => {
				if (object.id === 'root') return;
				const parentProperty = (object.type === 'place' ? 'folderid' : 'parent');
				let geomarksProperty;
				let neibours: Array<Place | Folder> =
					Object.values(this.places).filter(
						(neibour: Place) => neibour.folderid === object[parentProperty]
					) as Array<Place | Folder>
				;
				if (this.treeFlat[object[parentProperty]].children) {
					neibours = neibours.concat(
						Object.values(this.treeFlat[object[parentProperty]].children)
					);
				}
				for (let i = 0; i < neibours.length; i++) {
					geomarksProperty = (neibours[i].type === 'place' ? 'geomark' : 'geomarks');
					if (i === 0) {
						visibility = neibours[i][geomarksProperty];
						continue;
					}
					if (visibility != neibours[i][geomarksProperty]) {
						visibility = 2;
						break;
					}
				}
				this.showHideFolderGeomarks({
					folder: this.treeFlat[object[parentProperty]],
					show: Number(visibility) || 1,
				});
				showHideParentsGeomarks(this.treeFlat[object[parentProperty]]);
			}
			showHideSubGeomarks(payload.object, payload.show);
			showHideParentsGeomarks(payload.object);
		},
		setMessage(message: string) {
			message = message.replace(/[\t\n]/g, ' ');
			message = message.replace(/[ ]{2,}/g, ' ').trim();
			const messagesContainer = document.getElementById('messages');
			if (messagesContainer) {
				messagesContainer.classList.remove('invisible');
				messagesContainer.classList.add('visible');
			}
			const messageIndex = this.messages.indexOf(message);
			if (messageIndex !== -1) {
				const messageContainer = document.getElementById('message-' + messageIndex);
				if (messageContainer) {
					messageContainer.classList.add('highlight');
					window.setTimeout(() => {
						messageContainer.classList.remove('highlight');
					}, 500);
				}
			} else {
				this.setMessageMut(message);
			}
			if (this.messageTimer) {
				clearInterval(this.messageTimer);
			}
			this.setMessageTimer(
				window.setInterval(() => {
					if (!this.mouseOverMessages) {
						if (this.messages.length === 1) {
							this.clearMessages();
						}
						window.setTimeout(() => {
							this.deleteMessage(
								this.messages[this.messages.length - 1]
							);
						}, 500);
					}
				}, 3000)
			);
		},
		clearMessages() {
			clearInterval(this.messageTimer);
			const messagesContainer = document.getElementById('messages');
			if (messagesContainer) {
				messagesContainer.classList.remove('visible');
				messagesContainer.classList.add('invisible');
			}
			window.setTimeout(() => {
				this.clearMessagesMut();
			}, 500);
		},
	},
	getters: {
		placeFields() {
			const placeFields = {
				name               : this.t.i.captions.name,
				description        : this.t.i.captions.description,
				link               : this.t.i.captions.link,
				latitude           : this.t.i.captions.latitude,
				longitude          : this.t.i.captions.longitude,
				altitudecapability : this.t.i.captions.altitudecapability,
				range              : this.t.i.captions.range,
				time               : this.t.i.captions.time,
				srt                : this.t.i.captions.srt,
				common             : this.t.i.captions.common,
				images             : this.t.i.captions.images,
			}
			return placeFields;
		},
		treeFlat() {
			const treeFlat: Record<string, Folder> = {};
			treeToLivePlain(this.tree, 'children', treeFlat);
			return treeFlat;
		},
	},
});

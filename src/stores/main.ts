import { Ref, ref } from 'vue';
import { defineStore } from 'pinia';
import { User, Group, Point, Place, Track, Folder, Image } from './types';
import {
	emitter,
	constants,
	num2deg,
	coords2string,
	plainToTree,
	formFolderForImported,
	distanceOnSphere,
} from '@/shared';
import { t } from '@/lang/ru';
import axios from 'axios';

export interface IMainState {
	activeMapIndex: number,
	backup: boolean,
	center: Record<string, number>,
	centerPlacemarkShow: boolean,
	colortheme: string,
	commonPlacemarksShow: boolean,
	commonPlaces: Record<string, Place>,
	commonTracks: Record<string, Track>,
	commonTracksShow: boolean,
	commonPlacesPage: number,
	commonPlacesOnPageCount: number,
	currentPlace: Place | null,
	currentPoint: Point | null,
	currentTrack: Track | null,
	folders: Record<string, Folder>,
	homePlace: Place | null,
	idleTime: number,
	lang: string,
	langs: Record<string, string>[],
	measure: {
		points: string[],
		distance: number,
		choosing: number,
		show: boolean,
	},
	messages: string[],
	messageTimer: number,
	mode: string,
	mouseOverMessages: boolean,
	placemarksShow: boolean,
	places: Record<string, Place>,
	placesShow: boolean,
	points: Record<string, Point>,
	range: number | null,
	rangeShow: boolean,
	ready: boolean,
	refreshing: boolean,
	saved: boolean,
	serverConfig: any | null,
	stateBackups: any[],
	stateBackupsIndex: number,
	t: any,
	temps: Record<string, Point>,
	tempsPlacemarksShow: boolean,
	tempsShow: boolean,
	tracks: Record<string, Track>,
	tracksShow: boolean,
	tree: Folder,
	treeTracks: Folder,
	user: User | null,
	users: Record<string, User>,
	zoom: number,
}

export const useMainStore = defineStore('main', {
	state: (): IMainState => ({
		activeMapIndex: 0,
		backup: true,
		center: {
			latitude: Number(constants.map.initial.latitude),
			longitude: Number(constants.map.initial.longitude),
		},
		centerPlacemarkShow: true,
		colortheme: 'brown',
		commonPlacemarksShow: false,
		commonPlaces: {},
		commonTracks: {},
		commonTracksShow: false,
		commonPlacesPage: 1,
		commonPlacesOnPageCount: constants.commonplacesonpagecount,
			currentPlace: null,
		currentPoint: null,
		currentTrack: null,
		folders: {},
		homePlace: null,
		idleTime: 0,
		lang: 'ru',
		langs: [{
			value: 'ru',
			title: 'Русский',
		}, {
			value: 'en',
			title: 'English',
		}],
		measure: {
			points: [],
			distance: 0,
			choosing: 0,
			show: false,
		},
		messages: [],
		messageTimer: 0,
		mode: 'normal',
		mouseOverMessages: false,
		placemarksShow: true,
		places: {},
		placesShow: true,
		points: {},
		range: null,
		rangeShow: false,
		ready: false,
		refreshing: false,
		saved: true,
		serverConfig: null,
		stateBackups: [],
		stateBackupsIndex: -1,
		t: t,
		temps: {},
		tempsPlacemarksShow: true,
		tempsShow: false,
		tracks: {},
		tracksShow: false,
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
		treeTracks: {
			id: 'tracksroot',
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
		user: null,
		users: {},
		zoom: Number(constants.map.initial.zoom),
	}),
	actions: {
		deleteMessage(index) {
			this.messages.splice(index, 1);
		},
		setMouseOverMessages(over?: boolean) {
			this.mouseOverMessages = (over === false ? false : true);
		},
		setObjectSaved(object: User | Group | Point | Place | Track | Folder) {
			object.added = false;
			object.deleted = false;
			object.updated = false;
		},
		reset() {
			this.saved = true;
			this.idleTime = 0;
			this.stateBackups = [];
			this.stateBackupsIndex = -1;
			this.user = null;
			this.currentPlace = null;
			this.homePlace = null;
			this.points = {};
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
			this.tracks = {};
		},
		buildTrees() {
			const tree = plainToTree({plain: this.foldersFlat, live: true, keep: true});
			if (!tree) return;
			this.tree.children = {};
			this.treeTracks.children = {};
			this.folders = tree;
			for (const id in this.folders) {
				if (this.folders[id].parent === 'root') {
					this.tree.children[id] = this.folders[id];
					continue;
				}
				if (this.folders[id].parent === 'tracksroot') {
					this.treeTracks.children[id] = this.folders[id];
					continue;
				}
			}
			this.tree.userid = this.treeTracks.userid = this.user ? this.user.id : null;
			this.tree.name = this.t.i.captions.rootFolder;
			this.treeTracks.name = this.t.i.captions.rootTracksFolder;
		},
		placesReady(payload: Record<string, any>) {
			const { points, places, commonPlaces, tracks, commonTracks, folders, what } = payload;

			this.points = points ? points : {};
			this.places = places ? places : {};
			this.commonPlaces = commonPlaces ? commonPlaces : {};
			this.tracks = tracks ? tracks : {};
			this.commonTracks = commonTracks ? commonTracks : {};
			this.folders = folders ? folders : {};

			let added = false, deleted = false, updated = false;
			switch (what) {
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
			for (const point of (Object.values(this.points) as Point[])) {
				point.type = 'point';
				point.added = added;
				point.deleted = deleted;
				point.updated = updated;
				point.show = true;
				point.common = Boolean(point.common);
			}
			for (const place of (Object.values(this.places) as Place[])) {
				place.type = 'place';
				place.added = added;
				place.deleted = deleted;
				place.updated = updated;
				place.show = true;
				place.common = Boolean(place.common);
				place.geomark = Boolean(place.geomark);
			}
			for (const track of (Object.values(this.tracks) as Track[])) {
				track.type = 'track';
				track.added = added;
				track.deleted = deleted;
				track.updated = updated;
				track.show = true;
				track.common = Boolean(track.common);
			}
			for (const folder of (Object.values(this.folders) as Folder[])) {
				folder.type = 'folder';
				folder.added = added;
				folder.deleted = deleted;
				folder.updated = updated;
				folder.opened = false;
			}
			this.buildTrees();
		},
		modifyPlaces(places: Record<string, Place>) {
			this.places = places;
		},
		modifyTracks(tracks: Record<string, Track>) {
			this.tracks = tracks;
		},
		modifyCommonPlaces(commonPlaces: Record<string, Place>) {
			this.commonPlaces = commonPlaces;
		},
		modifyCommonTracks(commonTracks: Record<string, Track>) {
			this.commonTracks = commonTracks;
		},
		modifyFolders(folders: Record<string, Folder>) {
			this.folders = folders;
		},
		deleteImages(payload: Record<string, any>) {
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
		showInRange(range: number | null) {
			if (range <= 0 || range === null) {
				for (const id in this.places) this.places[id].show = true;
				return;
			}
			for (const id in this.places) {
				if (distanceOnSphere(
					this.points[this.places[id].pointid].latitude,
					this.points[this.places[id].pointid].longitude,
					this.points[this.currentPlace.pointid].latitude,
					this.points[this.currentPlace.pointid].longitude,
					constants.earthRadius
				) > range) {
					this.places[id].show = false;
				} else {
					this.places[id].show = true;
				}
			}
		},
		distanceBetweenPoints(ids: string[], where: string = 'points'): number {
			if (ids.length < 2) return 0;
			let distance = 0;
			for (let i = 1; i < ids.length; i++) {
				if (!this[where][ids[i]]) continue;
				distance += distanceOnSphere(
					this[where][ids[i]].latitude,
					this[where][ids[i]].longitude,
					this[where][ids[i - 1]].latitude,
					this[where][ids[i - 1]].longitude,
					constants.earthRadius
				);
			}
			return distance;
		},
		measureDistance() {
			let lastIdx: number | null = null;
			let point: Point, lastPoint: Point;
			this.measure.distance = 0;
			if (this.measure.points.length < 2) return;
			for (let i = 0; i < this.measure.points.length; i++) {
				let p = this.measure.points[i];
				if (p === null) continue;
				if (lastIdx === null) {
					lastIdx = i;
					continue;
				}
				let l = this.measure.points[lastIdx];
				if (this.places[p]) {
					point = this.points[this.places[p].pointid];
				} else if (this.commonPlaces[p]) {
					point = this.points[this.commonPlaces[p].pointid];
				} else if (this.temps[p]) {
					point = this.temps[p];
				} else {
					return;
				}
				if (this.places[l]) {
					lastPoint = this.points[this.places[l].pointid];
				} else if (this.commonPlaces[l]) {
					lastPoint = this.points[this.commonPlaces[l].pointid];
				} else if (this.temps[l]) {
					lastPoint = this.temps[l];
				} else {
					return;
				}
				this.measure.distance += distanceOnSphere(
					lastPoint.latitude,
					lastPoint.longitude,
					point.latitude,
					point.longitude,
					constants.earthRadius
				);
				lastIdx = i;
			}
		},
		changeLang(lang) {
			const getLang = () => import(`@/lang/${lang}.ts`);
			getLang().then(l => {
				this.lang = lang;
				this.t = l.t;
				this.tree.name = this.t.i.captions.rootFolder;
			});
		},
		backupState() {
			if (
				!this.backup ||
				this.stateBackups.length >= constants.backupscount
			) {
				return;
			}
			++this.stateBackupsIndex;
			this.stateBackups.splice(this.stateBackupsIndex);
			this.stateBackups.push(
				Object.assign({}, JSON.parse(JSON.stringify(this.$state)))
			);
			delete this.stateBackups[this.stateBackupsIndex].stateBackups;
		},
		restoreState(backupIndex: number) {
			if (
				backupIndex < 0 ||
				backupIndex > this.stateBackups.length - 1 ||
				this.stateBackupsIndex ===
				this.stateBackups[backupIndex].stateBackupsIndex
			) {
				return;
			}
			for (const key in this.stateBackups[backupIndex]) {
				this[key] =
					JSON.parse(
						JSON.stringify(
							this.stateBackups[backupIndex][key]
						)
					)
				;
			}
			this.saved = false;
			this.restoreObjectsAsLinks();
		},
		undo() {
			this.restoreState(this.stateBackupsIndex - 1);
			this.backup = false;
		},
		redo() {
			this.restoreState(this.stateBackupsIndex + 1);
			this.backup = false;
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
					sessionStorage.getItem('places-useruuid')
				)
				.then(response => {
					this.user = response.data;
				})
				.catch(e => {
					console.error(e);
					this.setMessage(this.t.m.popup.cannotGetData);
					this.user = null;
				})
			;
		},
		async setServerConfig() {
			return axios
				.get(
					'/backend/get_config.php?useruuid=' +
					sessionStorage.getItem('places-useruuid')
				)
				.then(response => {
					this.serverConfig = response.data;
				})
				.catch(e => {
					console.error(e);
					this.setMessage(this.t.m.popup.cannotGetData);
					this.serverConfig = null;
				})
			;
		},
		setFirstCurrentPlace() {
			this.currentPlace = null;
			if (this.homePlace) this.currentPlace = this.homePlace;
			else if (Object.keys(this.places).length) {
				let firstPlaceInRoot: Place = null;
				for (const id in this.places) {
					if (this.places[id].folderid === 'root') {
						firstPlaceInRoot = this.places[id];
						break;
					}
				}
				if (firstPlaceInRoot) this.currentPlace = firstPlaceInRoot;
				else this.currentPlace = this.places[Object.keys(this.places)[0]];
			}
		},
		async setPlaces(payload?: {mime: string, text: string | ArrayBuffer}) {
			// If reading from database, not importing
			if (!payload) {
				return axios
					.get(
						'/backend/get_places.php?id=' +
						sessionStorage.getItem('places-useruuid')
					)
					.then(response => {
						for (
							const folder of
							Object.values(response.data.folders) as Folder[]
						) {
							if (folder.parent === null) {
								folder.parent = 'root';
							}
						}
						this.placesReady({
							points: Object.assign({}, response.data.points),
							places: Object.assign({}, response.data.places),
							commonPlaces: Object.assign({}, response.data.common_places),
							folders: Object.assign({}, response.data.folders),
						});
						this.backup = false;
						this.setHomePlace({
							id: this.user.homeplace ? this.user.homeplace : null,
							todb: false,
						});
						this.backup = true;
						this.setFirstCurrentPlace();
						if (this.currentPlace) {
							this.updateMap({
								latitude: this.points[this.currentPlace.pointid].latitude,
								longitude: this.points[this.currentPlace.pointid].longitude,
							});
						}
					})
					.catch(e => {
						console.error(e);
						this.setMessage(this.t.m.popup.cannotGetDataFromDb);
						this.placesReady({
							points: {},
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
			const parseJSON = (text: string) => {
				try {
					const result =
						<Record<string, Array<Place | Track | Point | Folder>>>
						JSON.parse(text)
					;
					return result;
				} catch (e) {
					console.error(e);
					this.setMessage(this.t.m.popup.parsingImportError + ': ' + e);
					return null;
				}
			}
			const parseGPX = (text: string) => {
				const result = {
					points: [] as Array<Point>,
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
					this.setMessage(this.t.m.popup.parsingImportError + ': ' + e);
					return null;
				}
				if (this.tree.imported) {
					result.tree = this.tree.imported;
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
					const newPointId = crypto.randomUUID();
					const newPlaceId = crypto.randomUUID();
					const newPoint = {
						id: newPointId,
						userid: sessionStorage.getItem('places-useruuid'),
						latitude:
							Number(wpt.getAttribute('lat')) ||
							Number(constants.map.initial.latitude) ||
							null,
						longitude:
							Number(wpt.getAttribute('lon')) ||
							Number(constants.map.initial.longitude) ||
							null,
						time: time,
						type: 'point',
						common: false,
						added: true,
						deleted: false,
						updated: false,
						show: true,
					};
					const newPlace = {
						id: newPlaceId,
						pointid: newPointId,
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
						userid: sessionStorage.getItem('places-useruuid'),
						images: {},
						type: 'place',
						added: true,
						deleted: false,
						updated: false,
						show: true,
					};
					result.points.push(newPoint);
					result.places.push(newPlace);
				}
				result.tree = importedPlaceFolder.imported;
				return result;
			}
			const addImported = async (
				mime: string,
				parsed:
					Record<string,
						Array<Point | Place | Folder> |
						Record<string, Array<Point | Place> | Folder>
					> | null
			) => {
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
										this.folders[folder.id] ||
										!this.folders[folder.parent] &&
										(parsed.folders as Array<Folder>)
											.find(f => f.id === folder.parent)
									) {
										continue;
									}
									if (
										this.serverConfig.rights.folderscount < 0 ||
										this.serverConfig.rights.folderscount
											// length - 1 because there is a root folder too
											> Object.keys(this.folders).length - 1 ||
										this.user.testaccount
									) {
										const newFolder: Folder = {
											type: 'folder',
											userid: sessionStorage.getItem('places-useruuid') as string,
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
							let newPoint: Point;
							if (this.points[place.pointid]) {
								newPoint = this.points[place.pointid];
							} else {
								const parsedPoint =
									(parsed.points as Array<Point>)
										.find(w => w.id === place.pointid)
								;
								newPoint = {
									id: parsedPoint.id,
									userid: parsedPoint.userid,
									latitude:
										Number(parsedPoint.latitude) ||
										Number(constants.map.initial.latitude) ||
										null,
									longitude:
										Number(parsedPoint.longitude) ||
										Number(constants.map.initial.longitude) ||
										null,
									altitude: parsedPoint.altitude,
									time: parsedPoint.time,
									common: parsedPoint.common,
									type: 'point',
									added: true,
									deleted: false,
									updated: false,
									show: true,
								};
							}
							const newPlace: Place = {
								type: 'place',
								userid: sessionStorage.getItem('places-useruuid') as string,
								name: place.name,
								description: place.description,
								pointid: place.pointid,
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
							if (!this.points[place.pointid]) {
								await this.addPoint({
									point: newPoint,
									from: newPlace,
								});
							}
							await this.addPlace({ place: newPlace });
						} else {
							this.setMessage(
								this.t.m.popup.placesCountExceeded
							);
						}
					}
					emitter.emit('toDBCompletely');
				} catch (e) {
					console.error(e);
					this.setMessage(this.t.m.popup.parsingImportError + ': ' + e);
					return false;
				}
				return true;
			}
			let parsed: Record<string, any>;
			switch (payload.mime) {
				case 'application/json' :
					parsed = parseJSON(payload.text as string);
					break;
				case 'application/gpx+xml' :
					parsed = parseGPX(payload.text as string);
					break;
				default :
					this.setMessage(
						this.t.m.popup.invalidImportFileType
					);
					return false;
			}
			addImported(payload.mime, parsed);
		},
		async setUsers(payload?: string) {
			let ids = null;
			switch (payload) {
				case 'common':
					ids = [];
					for (const place of Object.values(this.commonPlaces) as Place[]) {
						if (!ids.includes(place.userid)) ids.push(place.userid);
					}
					break;
				default:
					break;
			}
			return axios
				.post(
					'/backend/get_users.php',
					Array.isArray(ids) ? { users: ids } : null
				)
				.then(response => {
					for (let idx = 0; idx < response.data.length; idx++) {
						this.users[response.data[idx].id] = {
							login: response.data[idx].login,
							name: response.data[idx].name,
						};
					}
				})
				.catch(e => console.error(e))
			;
		},
		replaceState(payload: IMainState) {
			this.$state = payload;
			this.changeLang(this.lang);
			this.restoreObjectsAsLinks();
			if (this.currentPlace) {
				this.updateMap({
					latitude: this.points[this.currentPlace.pointid].latitude,
					longitude: this.points[this.currentPlace.pointid].longitude,
				});
			}
		},
		restoreObjectsAsLinks() {
			this.refreshing = true;
			this.backup = false;
			this.setHomePlace({
				id: this.user.homeplace ? this.user.homeplace : null,
				todb: false,
			});
			this.backup = true;
			if (this.currentPlace) {
				let place: Place = null;
				if (this.commonPlaces[this.currentPlace.id])
					place = this.commonPlaces[this.currentPlace.id];
				if (this.places[this.currentPlace.id])
					place = this.places[this.currentPlace.id];
				this.currentPlace = place;
			}
			this.refreshing = false;
		},
		getNeighboursSrts(id: string, type: string, top?: boolean) {
			let fellows: Record<string, Folder | Place | Track> = this[type + 's'];
			let neighbours = Object.values(fellows);
			let item = fellows[id];
			if (!fellows[id] && type === 'folder') {
				fellows = id === 'tracksroot'
					? this.treeTracks.children
					: this.tree.children
				;
				item = fellows[id];
				neighbours = Object.values(fellows).filter(
					i => i['parent'] === item['parent']
				);
			} else {
				neighbours = Object.values(fellows).filter(
					i => i['folderid'] === item['folderid']
				);
			}
			const all = neighbours.map(i => i.srt).sort((a, b) => a - b);
			const currentIndex = all.indexOf(item.srt);
			const result = {
				all: all,
				own: item.srt,
				previous: all[currentIndex - 1],
				next: all[currentIndex + 1],
				new: 0,
			};
			if (!!top) {result.new = !result.previous
				? result.own / 2
				: (result.own - result.previous) / 2 + result.previous;
			} else {result.new = !result.next
				? result.own + 1
				: (result.next - result.own) / 2 + result.own;
			}
			return result;
		},
		async setHomePlace(payload: { id: string, todb?: boolean } | null) {
			if (payload && this.places[payload.id]) {
				this.homePlace = this.places[payload.id];
				this.user.homeplace = payload.id;
				if (payload.todb !== false) emitter.emit('homeToDB', payload.id);
			} else {
				this.homePlace = null;
				this.user.homeplace = null;
				if (!payload || payload.todb !== false) emitter.emit('homeToDB', null);
			}
			this.backupState();
		},
		async addFolder(payload: { folder: Folder, todb?: boolean }) {
			const { folder, todb } = payload;
			this.folders[folder.id] = folder;
			this.buildTrees();
			if (todb !== false && !this.user.testaccount) {
				emitter.emit('toDB', { 'folders': [folder] });
			}
			this.backupState();
		},
		async getAltitude (lat: number, lon: number, altRef?: Ref<number | null>) {
			const alt = altRef ? altRef : ref(null);
			try {
				const { data } = await axios.get(
					`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
				);
				alt.value = isNaN(Number(data.elevation)) ? null : Number(data.elevation);
				return alt.value;
			} catch {
				alt.value = null;
				return alt.value;
			}
		},
		wherePointIsUsed(id: string) {
			let uses: (Place | Track)[] = [];
			uses.push(
				...(Object.values(this.places) as Place[]).filter(place =>
					place.pointid === id
				),
				...(Object.values(this.tracks) as Track[]).filter(track =>
					track.points.includes(id)
				),
			);
			return uses;
		},
		choosePoint(point: Point, inMode?: string) {
			if (!point) {
				this.currentPoint = null;
				return;
			}
			switch (this.mode) {
				case 'measure':
					if (inMode && inMode === 'measure') {
						const { points, choosing } = this.measure;
						const idx = points.indexOf(point.id);
						if (idx === -1) points[choosing] = point.id; else points.splice(idx, 1);
						this.measure.choosing = points.length;
					}
				default:
					if (inMode === 'measure') break;
					if (this.currentTrack !== null) {
						const idx = this.currentTrack.points.indexOf(point.id);
						if (idx !== -1) this.currentTrack.choosing = idx;
					}
					if (this.currentPoint !== point) {
						this.currentPoint = point;
					}
				}
		},
		choosePlace(place: Place, inMode?: string) {
			if (!place) {
				this.currentPlace = null;
				return;
			}
			switch (this.mode) {
				case 'measure':
					if (inMode && inMode === 'measure') {
						const { points, choosing } = this.measure;
						const placeId = place.id;
						const idx = points.indexOf(placeId);
						if (idx === -1)  points[choosing] = placeId; else points.splice(idx, 1);
						this.measure.choosing = points.length;
					}
				default:
					if (inMode === 'measure') break;
					if (this.currentPlace !== place) {
						this.currentPlace = place;
						this.currentPlaceCommon = this.currentPlace.userid !== this.user.id;
					}
			}
		},
		chooseTrack(track: Track, inMode?: string) {
			if (!track) {
				this.currentTrack = null;
				return;
			}
			switch (this.mode) {
				case 'measure':
					if (inMode && inMode === 'measure') {
						const { points, choosing } = this.measure;
						const trackId = track.id;
						const idx = points.indexOf(trackId);
						if (idx === -1)  points[choosing] = trackId; else points.splice(idx, 1);
						this.measure.choosing = points.length;
					}
				default:
					if (inMode === 'measure') break;
					if (this.currentTrack !== track) {
						this.currentTrack = track;
						this.currentTrackCommon = this.currentTrack.userid !== this.user.id;
					}
			}
		},
		objectClick(object: Place | Point, type: string) {
			switch (object.type) {
				case 'point':
					if (type === 'contextmenu') {
						switch (this.mode) {
							case 'measure':
								this.choosePoint(object, 'measure');
								break;
							case 'tracks':
								if (this.currentTrack) {
									if (this.currentTrack.points.includes(object.id)) {
										this.deleteTrackPoint(object, this.currentTrack);
									} else {
										this.currentTrack.points.push(object.id);
									}
									break;
								}
							default:
								this.setMessage(
									coords2string([object['latitude'], object['longitude']]) + (
										object['altitude']
											? (' | ' + object['altitude']) + ' ' + this.t.i.text.m
											: ''
									),
									true
								);
						}
					} else {
						this.choosePoint(object);
					}
					break;
				case 'place':
					if (type === 'contextmenu') {
						switch (this.mode) {
							case 'measure':
								this.choosePlace(object, 'measure');
								break;
							case 'tracks':
								if (this.currentTrack) {
									if (this.currentTrack.points.includes(object.id)) {
										this.removeTrackPoint(object, this.currentTrack);
									} else {
										this.currentTrack.points.push(object.id);
									}
									break;
								}
							default:
								this.setMessage(object['name'], true);
								this.setMessage(
									coords2string([
										this.points[object['pointid']].latitude,
										this.points[object['pointid']].longitude
									]),
									true
								);
								this.setMessage(object['description'], true);
						}
					} else {
						this.choosePlace(object);
					}
					if (object.common) {
						const inPaginator =
							Object.keys(this.commonPlaces).indexOf(object.id) /
							this.commonPlacesOnPageCount
						;
						this.commonPlacesPage =
							Number.isInteger(inPaginator)
								? inPaginator + 1
								: Math.ceil(inPaginator)
						;
					}
					break;
			}
		},
		addTemp(
			point: Point = {
				id: crypto.randomUUID(),
				userid: sessionStorage.getItem('places-useruuid'),
				latitude: this.center.latitude,
				longitude: this.center.longitude,
				altitude: null,
				name: '',
				common: false,
				type: 'point',
				added: false,
				deleted: false,
				updated: false,
				show: true,
			}
		) {
			if (!Object.keys(this.temps).length) this.tempsShow = true;
			if (!point.name) {
				const numberNames = Object.values(this.temps).map(
					(temp: Point) => Number(temp.name)
				);
				point.name = (
					(numberNames.length ? Math.max(...numberNames) : 0) + 1
				).toString();
			}
			this.temps[point.id] = point;
			this.currentPoint = this.temps[point.id];
			if (this.temps[point.id].altitude === null) {
				this.temps[point.id].altitude = this.getAltitude(
					this.temps[point.id].latitude,
					this.temps[point.id].longitude,
				);
			}
			this.backupState();
			return this.temps[point.id];
		},
		async addPoint(payload: {
			point: Point,
			from?: Place | Track,
			to?: Place | Track,
			todb?: boolean,
		}) {
			const { point, from, to, todb } = payload;
			if (to) to[point.id] = point; else this.points[point.id] = point;
			if (todb !== false && !this.user.testaccount) {
				emitter.emit('toDB', {
					'points': [{ ...point, from: (from ? from : null) }],
				});
			}
		},
		async addPlace(payload: { place: Place, todb?: boolean }) {
			const { place, todb } = payload;
			this.places[place.id] = place;
			if (todb !== false && !this.user.testaccount) {
				emitter.emit('toDB', { 'places': [ place ] });
			}
			this.backupState();
		},
		async addTrack(payload: { track: Track, todb?: boolean }) {
			const { track, todb } = payload;
			this.tracks[track.id] = track;
			if (todb !== false && !this.user.testaccount) {
				emitter.emit('toDB', { 'tracks': [ track ] });
			}
			this.backupState();
		},
		addTrackPoint(
			point: Point = {
				id: crypto.randomUUID(),
				userid: sessionStorage.getItem('places-useruuid'),
				latitude: this.center.latitude,
				longitude: this.center.longitude,
				altitude: null,
				name: '',
				common: false,
				type: 'point',
				added: true,
				deleted: false,
				updated: false,
				show: true,
			},
			track: Track = this.currentTrack,
		) {
			if (!point.name) {
				const numberNames = this.trackPoints(track).map(
					(point: Point) => Number(point.name)
				);
				point.name = (
					(numberNames.length ? Math.max(...numberNames) : 0) + 1
				).toString();
			}
			this.points[point.id] = point;
			track.points.push(point.id);
			this.choosePoint(this.points[point.id]);
			if (this.points[point.id].altitude === null) {
				this.points[point.id].altitude = this.getAltitude(
					this.points[point.id].latitude,
					this.points[point.id].longitude,
				);
			}
			this.backupState();
		},
		async removeTrackPoint(point: Point, track: Track = this.currentTrack) {
			let idx = track.points.indexOf(point.id);
			if (idx === -1) return;
			track.points.splice(idx, 1);
			if (idx > track.points.length - 1) idx =  track.points.length - 1;
			this.choosePoint(
				this.points[track.points[idx]]
					? this.points[track.points[idx]]
					: this.temps[track.points[idx]]
			);
			this.backupState();
		},
		async changeFolder(payload: Record<string, any>) {
			let saveToDB = payload.todb !== false;
			for (const key in payload.change) {
				payload.folder[key] = payload.change[key];
			}
			if (saveToDB !== false && !this.user.testaccount) {
				payload.folder.updated = true;
				emitter.emit('toDB', { 'folders': [payload.folder] });
			}
			this.backupState();
		},
		async changePoint(payload: Record<string, any>) {
			let saveToDB = payload.todb !== false;
			for (const key in payload.change) {
				payload.point[key] = payload.change[key];
			}
			if (saveToDB && !this.user.testaccount) {
				payload.point.updated = true;
				emitter.emit('toDB', {
					'points': [{
						...payload.point,
						from: (payload.from ? payload.from : null),
					}],
				});
			}
		},
		async changePlace(payload: Record<string, any>) {
			let saveToDB = payload.todb !== false;
			if ('latitude' in payload.change || 'longitude' in payload.change) {
				const
					lat = num2deg(('latitude' in payload.change
						? payload.change.latitude
						: this.points[payload.place.pointid].latitude
					), true),
					lng = num2deg(('longitude' in payload.change
						? payload.change.longitude
						: this.points[payload.place.pointid].longitude
					))
				;
				this.changePoint({
					point: this.points[payload.place.pointid],
					change: {
						latitude: Number(lat),
						longitude: Number(lng),
						altitude: payload.change.altitude
							? payload.change.altitude
							: this.getAltitude(Number(lat), Number(lng))
						,
					},
					from: payload.place,
				});
			}
			for (const key in payload.change) {
				if (key === 'latitude' || key === 'longitude') continue;
				payload.place[key] = key === 'srt'
					? (Number(payload.change[key]) || 0)
					: payload.change[key]
				;
			}
			if (saveToDB && !this.user.testaccount) {
				payload.place.updated = true;
				emitter.emit('toDB', { 'places': [ payload.place ] });
			}
			this.backupState();
		},
		async changeTrack(payload: Record<string, any>) {
			let saveToDB = payload.todb !== false;
			for (const key in payload.change) {
				payload.track[key] = key === 'srt'
					? (Number(payload.change[key]) || 0)
					: payload.change[key]
				;
			}
			if (saveToDB && !this.user.testaccount) {
				payload.track.updated = true;
				emitter.emit('toDB', { 'tracks': [payload.track] });
			}
			this.backupState();
		},
		async deleteObjects(payload: {
			objects?: Record<string, Point | Place | Track | Folder>,
			todb?: boolean,
		} = {
			objects: {},
			todb: true,
		}) {
			const data = {
				points: <Array<Point>>[],
				places: <Array<Place>>[],
				tracks: <Array<Track>>[],
				folders: <Array<Folder>>[],
			};
			if (!Object.values(payload.objects).length) {
				for (const what in data) {
					data[what] = Object.values(this[what]).filter(object =>
						Object.hasOwn(
							object as Point | Place | Track | Folder,
							'deleted',
						)
						&& object['deleted'] === true
					);
				}
			} else {
				for (const object of Object.values(payload.objects)) {
/* Add points used only by the object in the payload
					let points = <Array<Point>>[];
					if (object['pointid']) {
						points.push(this.points[object['pointid']]);
					}
					if (object['pointids']) {
						for (const id of object['pointids']) {
							points.push(this.points[id]);
						}
					}
					for (const point of points) {
						if (!this.sharingPointsIds.includes(point.id)) {
							this.points[point.id].deleted = true;
							data.points.push(point);
						}
					}
*/
					object.deleted = true;
					data[object.type + 's'].push(object);
				}
			}
			for (const what in data) {
				for (const object of data[what]) delete this[what][object.id];
			}
			this.buildTrees();
			if (!this.user.testaccount && payload.todb !== false) {
				emitter.emit('toDB', data);
			}
			this.backupState();
		},
		deleteTemp(id: string) {
			const measureIndex = this.measure.points.indexOf(id);
			if (measureIndex !== -1) {
				this.measure.points.splice(measureIndex, 1);
				this.measure.choosing = this.measure.points.length;
			}
			delete this.temps[id];
			if (this.currentPoint && this.currentPoint.id === id) {
				this.currentPoint = null;
			}
		},
		deleteAllTemps() {
			for (let id in this.temps) {
				this.deleteTemp(id);
			}
		},
		async deleteTrackPoint (point: Point, track: Track) {
			console.log(this.wherePointIsUsed(point));
			console.log('track:');
			console.log(track);
		},
		savedToDB(payload: Record<
			string,
			string | Array<Point | Place | Image | Folder>
		>) {
			switch (payload.what) {
				case 'points' :
					if (payload.data) {
						for (const point of payload.data) {
							this.setObjectSaved(point);
						}
					} else {
						for (const id in this.points) {
							this.setObjectSaved(this.points[id]);
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
						for (const id in this.folders) {
							this.setObjectSaved(this.folders[id]);
						}
					}
					break;
				default :
					if (payload.data) {
						for (const point of payload.data) {
							this.setObjectSaved(point);
						}
						for (const place of payload.data) {
							this.setObjectSaved(place);
						}
						for (const folder of payload.data) {
							this.setObjectSaved(folder);
						}
					} else {
						for (const id in this.points) {
							this.setObjectSaved(this.points[id]);
						}
						for (const id in this.places) {
							this.setObjectSaved(this.places[id]);
						}
						for (const id in this.folders) {
							this.setObjectSaved(this.folders[id]);
						}
					}
	
			}
			this.saved = true;
		},
		folderOpenClose(payload: Record<string, any>) {
			if (payload.folder) {
				payload.folder.opened =
					Object.hasOwn(payload, 'opened')
						? payload.opened
						: !payload.folder.opened
				;
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
		swapSrts(payload: any[]) {
			payload[0].srt = [ payload[1].srt, payload[1].srt = payload[0].srt ][0];
		},
		updateMap(payload: Record<string, any>) {
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
		placemarksShowHide(show? : boolean) {
			this.placemarksShow = show === undefined
				? !this.placemarksShow
				: show
			;
		},
		commonPlacemarksShowHide(show? : boolean) {
			this.commonPlacemarksShow = show === undefined
				? !this.commonPlacemarksShow
				: show
			;
		},
		commonTracksShowHide(show? : boolean) {
			this.commonTracksShow = show === undefined
				? !this.commonTracksShow
				: show
			;
		},
		centerPlacemarkShowHide(show? : boolean) {
			this.centerPlacemarkShow = show === undefined
				? !this.centerPlacemarkShow
				: show
			;
		},
		showHideGeomarks(payload: Record<string, any>) {
			let visibility: number;
			const showHideSubsGeomarks = (
				object: Place | Track | Folder,
				show: number | boolean
			) => {
				switch (object.type) {
					case 'place':
						object['geomark'] = show;
						return;
					case 'track':
						object['geomarks'] = show;
						return;
					case 'folder':
						object['geomarks'] = !show ? 0 : 1;
						for (const item of
							Object.values({ ...this.places, ...this.tracks })
								.filter((item: Place | Track) => {
									if (
										item.folderid === object.id ||
										item.folderid === null &&
										(
											object.id === 'root' ||
											object.id === 'tracksroot'
										)
									) {
										return true;
									} else {
										return false;
									}
								})
						) {
							item[item['type'] !== 'place' ? 'geomarks' : 'geomark'] = show;
						}
						if (!object['children']) return;
						for (const folder of Object.values(object['children'])) {
							showHideSubsGeomarks(folder as Folder, !show ? 0 : 1);
						}
						break;
				}
			}
			const showHideParentsGeomarks = (object: Place | Track | Folder) => {
				const objectParentKey =
					Object.hasOwn(object, 'folderid') ? 'folderid' : 'parent'
				;
				let neibours =
					Object.values({ ...this.places, ...this.tracks, ...this.folders })
						.filter(
							(neibour: Place | Track | Folder) => {
								const neibourParentKey =
									Object.hasOwn(neibour, 'folderid') ? 'folderid' : 'parent'
								;
								if (
									neibour[neibourParentKey] === object[objectParentKey] ||
									(
										neibour[neibourParentKey] === 'root' ||
										neibour[neibourParentKey] === 'tracksroot' ||
										neibour[neibourParentKey] === null
									) && (
										object[objectParentKey] === 'root' ||
										object[objectParentKey] === 'tracksroot' ||
										object[objectParentKey] === null
									)
								) {
									return true;
								} else {
									return false;
								}
							}
						) as Array<Place | Track | Folder>
				;
				for (let i = 0; i < neibours.length; i++) {
					if (i === 0) {
						visibility = (neibours[i]['geomark'] ?? neibours[i]['geomarks']);
						continue;
					}
					if (visibility != (neibours[i]['geomark'] ?? neibours[i]['geomarks'])) {
						visibility = 2;
						break;
					}
				}
				let parent: Folder =
					this.folders[object[objectParentKey]] ??
					this.tree[object[objectParentKey]] ??
					this.treeTracks[object[objectParentKey]] ??
					null
				;
				if (parent === null) {
					if (
						object['parent'] === 'root' ||
						object.type === 'place' && object['folderid'] === null
					) {
						this.tree.geomarks = Number(visibility);
					}
					if (
						object['parent'] === 'tracksroot' ||
						object.type === 'track' && object['folderid'] === null
					) {
						this.treeTracks.geomarks = Number(visibility);
					}
					return;
				}
				parent.geomarks = Number(visibility);
				showHideParentsGeomarks(parent);
			}
			showHideSubsGeomarks(payload.object, payload.show);
			showHideParentsGeomarks(payload.object);
		},
		setMessage(message: string, freeze?: boolean) {
			message = message.replace(/[\t\n]/g, ' ');
			message = message.replace(/[ ]{2,}/g, ' ').trim();
			if (!message) return;
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
				this.messages.push(message);
			}
			if (this.messageTimer) {
				clearInterval(this.messageTimer);
			}
			this.messageTimer = window.setInterval(() => {
				if (!this.mouseOverMessages && !freeze) {
					if (this.messages.length === 1) {
						this.clearMessages();
					}
					window.setTimeout(() => {
						this.deleteMessage(
							this.messages[this.messages.length - 1]
						);
					}, 500);
				}
			}, 5000);
		},
		clearMessages() {
			clearInterval(this.messageTimer);
			const messagesContainer = document.getElementById('messages');
			if (messagesContainer) {
				messagesContainer.classList.remove('visible');
				messagesContainer.classList.add('invisible');
			}
			window.setTimeout(() => {
				this.messages = [];
			}, 500);
		},
	},
	getters: {
		descriptionFields() {
			const descriptionFields = {
				name               : this.t.i.captions.name,
				description        : this.t.i.captions.description,
				link               : this.t.i.captions.link,
				latitude           : this.t.i.captions.latitude,
				longitude          : this.t.i.captions.longitude,
				coordsMinSec       : this.t.i.captions.coordsMinSec,
				altitudecapability : this.t.i.captions.altitudecapability,
				range              : this.t.i.captions.range,
				time               : this.t.i.captions.time,
				srt                : this.t.i.captions.srt,
				common             : this.t.i.captions.common,
				images             : this.t.i.captions.images,
			}
			return descriptionFields;
		},
		sharingPointsIds() {
			let usingPointsIds: string[] = [];
			usingPointsIds = usingPointsIds.concat(
				Object.values(this.places).map((place: Place) => place.pointid)
			);
			for (const track of Object.values(this.tracks)) {
				usingPointsIds = usingPointsIds.concat(
					(track as Track).points.map(id =>
						this.places[id] ? this.places[id].pointid : id
				));
			}
			return usingPointsIds.filter((id, index, self) =>
				self.indexOf(id) !== index
			);
		},
		foldersFlat() {
			let foldersFlat = {};
			for (const folder of Object.values(this.folders) as Folder[]) {
				foldersFlat[folder.id] = {};
				for (const key in folder) {
					if (key === 'children') continue;
					foldersFlat[folder.id][key] = folder[key];
				}
			}
			return foldersFlat as Record<string, Folder>;
		},
		measureTemps() {
			return Object.values(this.temps).filter(
				(point: Point) => point.type === 'point'
			);
		},
		tempIndexById: state => {
			return (id: string) => Object.keys(state.temps).indexOf(id);
		},
		trackPoints() {
			return (track: Track): Point[] => {
				if (track === null) return [];
				let points: Point[] = [];
				for (const id of track.points) {
					if (id in this.points) points.push(this.points[id]);
						else if (id in this.temps) points.push(this.temps[id]);
				}
				return points;
			}
		},
		// Since the track points can be either its own or independent
		// or points of other places, we collect them all in one array
		trackAllPointsArray() {
			return (track: Track): { point: Point, of: string }[] => {
				let points: { point: Point, of: string }[] = [];
				let of: string;
				for (const id of track.points) {
					if (id in this.temps) of = 'temps';
					else if (
						Object.values(this.places).map((p: Place) => p.pointid)
							.includes(id)
					) {
						of = 'places';
					}
					points.push({
						point: this.points[id],
						of: of,
					});
				}
				return points;
			}
		},
		getPointCoordsArray () {
			return (pointIdsArray: string[]): number[][] => {
				const coords: number[][] = [];
				let point: Point;
				for (const id of pointIdsArray) {
					if (this.points[id]) {
						point = this.points[id];
					} else if (this.temps[id]) {
						point = this.temps[id];
					} else if (this.places[id]) {
						point = this.points[this.places[id].pointid];
					} else if (this.commonPlaces[id]) {
						point = this.points[this.commonPlaces[id].pointid];
					} else {
						return [];
					}
					coords.push([point.latitude, point.longitude]);
				}
				return coords;
			}
		},
	},
});

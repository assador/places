import { defineStore } from 'pinia';
import {
	AppendMode,
	FirstShow,
	PointName,
	User,
	Group,
	Point,
	Place,
	Route,
	Folder,
	DataToDB,
	Measure,
} from './types';
import {
	emitter,
	constants,
	plainToTree,
	formFolderForImported,
	distanceOnSphere,
} from '@/shared';
import axios from 'axios';
import { t } from '@/lang/ru';

export interface IMainState {
	activeMapIndex: number,
	backup: boolean,
	center: Record<string, number>,
	centerPlacemarkShow: boolean,
	colortheme: string,
	commonPlacemarksShow: boolean,
	commonPlaces: Record<string, Place>,
	commonPlacesOnPageCount: number,
	commonPlacesPage: number,
	commonPlacesShow: boolean,
	commonRoutes: Record<string, Route>,
	commonRoutesOnPageCount: number,
	commonRoutesPage: number,
	commonRoutesShow: boolean,
	currentPlace: Place | null,
	currentPoint: Point | null,
	currentRoute: Route | null,
	folders: Record<string, Folder>,
	homePlace: Place | null,
	idleTime: number,
	lang: string,
	langs: Record<string, string>[],
	measure: Measure,
	messages: string[],
	messageTimer: number,
	mode: string,
	mouseOverMessages: boolean,
	placemarksShow: boolean,
	places: Record<string, Place>,
	placesShow: FirstShow,
	points: Record<string, Point>,
	range: number | null,
	rangeShow: boolean,
	ready: boolean,
	refreshing: boolean,
	routes: Record<string, Route>,
	routesShow: boolean,
	saved: boolean,
	serverConfig: any | null,
	stateBackups: any[],
	stateBackupsIndex: number,
	t: any,
	temps: Record<string, Point>,
	tempsPlacemarksShow: boolean,
	tempsShow: FirstShow,
	tree: Folder,
	treeRoutes: Folder,
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
		commonPlacesOnPageCount: constants.commonplacesonpagecount,
		commonPlacesPage: 1,
		commonPlacesShow: false,
		commonRoutes: {},
		commonRoutesOnPageCount: constants.commonroutesonpagecount,
		commonRoutesPage: 1,
		commonRoutesShow: false,
		currentPlace: null,
		currentPoint: null,
		currentRoute: null,
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
			type: 'measure',
			points: [],
			choosing: null,
			show: false,
		},
		messages: [],
		messageTimer: 0,
		mode: 'normal',
		mouseOverMessages: false,
		placemarksShow: true,
		places: {},
		placesShow: { show: true, first: true },
		points: {},
		range: null,
		rangeShow: false,
		ready: false,
		refreshing: false,
		routes: {},
		routesShow: false,
		saved: true,
		serverConfig: null,
		stateBackups: [],
		stateBackupsIndex: -1,
		t: t,
		temps: {},
		tempsPlacemarksShow: true,
		tempsShow: { show: false, first: true },
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
		treeRoutes: {
			id: 'routesroot',
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
	persist: true,
	actions: {
		_defaultPoint(): Point {
			return {
				type: 'point',
				id: crypto.randomUUID(),
				userid: this.user!.id,
				latitude: this.center.latitude,
				longitude: this.center.longitude,
				altitude: null,
				time: new Date().toISOString().slice(0, -5),
				common: false,
				added: false,
				deleted: false,
				updated: false,
				show: true,
			};
		},
		_defaultPlace(): Place {
			const nextSrt = Object.values(this.places as Record<string, Place>)
				.filter(f => f.folderid === 'root')
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			return {
				type: 'place',
				id: crypto.randomUUID(),
				userid: this.user!.id,
				folderid: 'root',
				name: '',
				description: '',
				pointid: '',
				link: '',
				time: new Date().toISOString().slice(0, -5),
				srt: nextSrt,
				common: false,
				geomark: true,
				images: {},
				added: false,
				deleted: false,
				updated: false,
				show: true,
			};
		},
		_defaultRoute(): Route {
			const nextSrt = Object.values(this.routes as Record<string, Route>)
				.filter(f => f.folderid === 'routesroot')
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			return {
				type: 'route',
				id: crypto.randomUUID(),
				userid: this.user!.id,
				folderid: 'routesroot',
				points: [],
				choosing: null,
				name: '',
				description: '',
				link: '',
				time: new Date().toISOString().slice(0, -5),
				srt: nextSrt,
				common: false,
				geomarks: 1,
				images: {},
				added: false,
				deleted: false,
				updated: false,
				show: true,
			};
		},
		_defaultFolder(): Folder {
			const nextSrt = Object.values(this.folders as Record<string, Folder>)
				.filter(f => f.parent === 'root')
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			return {
				type: 'folder',
				id: crypto.randomUUID(),
				userid: this.user!.id,
				parent: 'root',
				name: '',
				description: '',
				srt: nextSrt,
				geomarks: 1,
				builded: false,
				added: false,
				deleted: false,
				updated: false,
				opened: true,
			};
		},

// SEC Creating Entities

	createPoint(overrides: Partial<Point>): Point {
			const point: Point = {
				...this._defaultPoint(),
				...overrides,
			};
			return point;
		},
		createPlace(overrides: Partial<Place>): Place {
			const place: Place = {
				...this._defaultPlace(),
				...overrides,
			};
			return place;
		},
		createRoute(overrides: Partial<Route>): Route {
			const route: Route = {
				...this._defaultRoute(),
				...overrides,
			};
			return route;
		},
		createFolder(overrides: Partial<Folder>): Folder {
			const folder: Folder = {
				...this._defaultFolder(),
				...overrides,
			};
			return folder;
		},

// SEC Upserting Entities

		upsertPoint({
			object,
			props = {},
			where = this.points,
			whom,
			name,
			description,
			mode = 'new',
		}: {
			object?: Point;
			props?: Partial<Point>;
			where?: Record<string, Point>;
			whom?: Place | Route,
			name?: string,
			description?: string,
			todb?: boolean;
			mode?: AppendMode,
		} = {}) {

			let point: Point;

			if (
				this.tempsShow.first &&
				this.mode === 'normal' &&
				where === this.temps
			) {
				this.tempsShow.show = true;
				this.tempsShow.first = false;
			}
			if (mode === 'new' || mode === 'clone') {
				// Check points limit
				if (
					!this.user.testaccount &&
					this.serverConfig.rights.pointscount > 0 &&
					Object.keys(where).length >= this.serverConfig.rights.pointscount
				) {
					this.setMessage(this.t.m.popup.pointsCountExceeded);
					return;
				}
			}

			switch (mode) {
				case 'move':
					point = object!;
					break;
				case 'change':
					Object.assign(object!, { updated: true }, props);
					point = object!;
					break;
				case 'new':
					point = this.createPoint({ added: true, ...props });
					where[point.id] = point;
					if (whom) {
						if ('pointid' in whom) whom.pointid = point.id;
						if ('points' in whom && Array.isArray(whom.points)) {
							whom.points.push({
								id: point.id,
								name: name || `${whom.points.length + 1}`,
								description: description ||
								`${this.t.i.captions.routePoint} № ${whom.points.length + 1}`,
							});
						}
						whom.updated = true;
					}
					break;
				case 'clone':
					point = this.createPoint({
						...object!,
						id: crypto.randomUUID(),
						added: true,
						...props,
					});
					where[point.id] = point;
					if (whom) {
						if ('pointid' in whom) whom.pointid = point.id;
						if ('points' in whom && Array.isArray(whom.points)) {
							const pn = whom.points.find(p => p.id === object.id);
							if (pn) {
								pn.id = point.id;
							}
						}
						whom.updated = true;
					}
					break;
			}
			this.getAltitude(point.latitude, point.longitude)
				.then((alt: number) => {
					point.altitude = alt;
				})
			;
			where = { ...where };
			this.saved = false;
			this.backupState();
			return point;
		},
		upsertPlace({
			object,
			props,
			where = this.places,
			mode = 'new',
		}: {
			object?: Place;
			props?: Partial<Place>;
			where?: Record<string, Place>;
			todb?: boolean;
			mode?: AppendMode,
		} = {}): Place {

			let place: Place;
			let point: Point;

			const folderId = props?.folderid || object?.folderid || 'root';
			const nextSrt = Object.values(where)
				.filter(f => f.folderid === folderId)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			if (mode === 'new' || mode === 'clone') {
				// Check places limit
				if (
					!this.user.testaccount &&
					this.serverConfig.rights.placescount > 0 &&
					Object.keys(where).length >= this.serverConfig.rights.placescount
				) {
					this.setMessage(this.t.m.popup.placesCountExceeded);
					return;
				}
			}

			switch (mode) {
				case 'move':
					place = object!;
					break;
				case 'change':
					Object.assign(object!, { updated: true }, props);
					place = object!;
					break;
				case 'new':
					point = this.createPoint({ added: true, ...props });
					place = this.createPlace({
						pointid: point.id,
						folderid: folderId,
						srt: nextSrt,
						added: true,
						...props,
					});
					this.points[point.id] = point;
					where[place.id] = place;
					break;
				case 'clone':
					const pointOriginal = this.getPointById(object!.pointid);
					point = this.createPoint({
						...(pointOriginal ? pointOriginal : {}),
						id: crypto.randomUUID(),
						added: true,
					});
					place = this.createPlace({
						...object!,
						id: crypto.randomUUID(),
						pointid: point.id,
						srt: nextSrt,
						added: true,
						...props,
					});
					where[place.id] = place;
					break;
			}
			this.setCurrentPlace(place);
			this.saved = false;
			this.backupState();
			return place;
		},
		upsertRoute({
			object,
			props,
			where = this.routes,
			mode = 'new',
		}: {
			object?: Route;
			props?: Partial<Route>;
			where?: Record<string, Route>;
			todb?: boolean;
			mode?: AppendMode,
		} = {}): Route {

			let route: Route;

			const folderId = props?.folderid || object?.folderid || 'routesroot';
			const nextSrt = Object.values(where)
				.filter(f => f.folderid === folderId)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			if (mode === 'new' || mode === 'clone') {
				// Check routes limit
				if (
					!this.user.testaccount &&
					this.serverConfig.rights.routescount > 0 &&
					Object.keys(where).length >= this.serverConfig.rights.routescount
				) {
					this.setMessage(this.t.m.popup.routesCountExceeded);
					return;
				}
			}

			switch (mode) {
				case 'move':
					route = object!;
					break;
				case 'change':
					Object.assign(object!, { updated: true }, props);
					route = object!;
					break;
				case 'new':
					route = this.createRoute({
						folderid: folderId,
						srt: nextSrt,
						added: true,
						...props,
					});
					where[route.id] = route;
					break;
			}
			this.setCurrentRoute(route);
			this.saved = false;
			this.backupState();
			return route;
		},
		upsertFolder({
			object,
			props,
			where = this.folders,
			mode = 'new',
		}: {
			object?: Folder;
			props?: Partial<Folder>;
			where?: Record<string, Folder>;
			todb?: boolean;
			mode?: AppendMode;
		} = {}): Folder {

			let folder: Folder;

			const parentId = props?.parent || object?.parent || 'root';
			const nextSrt = Object.values(where)
				.filter(f => f.parent === parentId)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			if (mode === 'new') {
				// Check folders limit
				if (
					!this.user.testaccount &&
					this.serverConfig.rights.folderscount > 0 &&
					Object.keys(where).length >= this.serverConfig.rights.folderscount
				) {
					this.setMessage(this.t.m.popup.foldersCountExceeded);
					return;
				}
			}

			switch (mode) {
				case 'move':
					Object.assign(object!, props);
					folder = object!;
					break;
				case 'change':
					Object.assign(object!, { updated: true }, props);
					folder = object!;
					break;
				case 'new':
					folder = this.createFolder({
						parent: parentId,
						srt: nextSrt,
						added: true,
						...props,
					});
					where[folder.id] = folder;
					break;
			}
			this.buildTrees();
			this.saved = false;
			this.backupState();
			return folder;
		},

// SEC Deleting Entities

		async deleteObjects(payload: {
			objects?: Record<string, Point | Place | Route | Folder>,
			todb?: boolean,
		} = {
			objects: {},
			todb: true,
		}) {
			const data = {
				points: <Array<Point>>[],
				places: <Array<Place>>[],
				routes: <Array<Route>>[],
				folders: <Array<Folder>>[],
			};
			if (!Object.values(payload.objects).length) {
				for (const what in data) {
					data[what] = Object.values(this[what]).filter(object =>
						Object.hasOwn(
							object as Point | Place | Route | Folder,
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
// FIXME Remove mainStore.saved = … / this.saved = … throughout the project and centralize this matter as completely as possible.
			this.buildTrees();
			this.saved = false;
			this.backupState();
		},
		deleteTemp(id: string) {
			const measureIndex = this.measure.points.map(p => p.id).indexOf(id);
			if (measureIndex !== -1) {
				if (this.measure.choosing > this.measure.points.length - 2) {
					this.measure.choosing = this.measure.points.length - 2
					if (this.measure.choosing < 0) this.measure.choosing = null;
				};
				this.measure.points.splice(measureIndex, 1);
			}
			delete this.temps[id];
			if (this.currentPoint && this.currentPoint.id === id) {
				this.setCurrentPoint(null);
			}
		},
		deleteAllTemps() {
			for (let id in this.temps) {
				this.deleteTemp(id);
			}
		},

// SEC Setting Current

		setCurrentPoint<T extends string | Point | null | undefined>(
			param: T,
			center?: boolean | undefined,
		) {
			let point = null;
			if (typeof param === 'string') {
				point = this.getPointById(param) ?? null;
			} else {
				point = param ?? null;
			}
			this.currentPoint = point;
			if (!point) return;
			if (point.altitude === null) {
				this.getAltitude(point.latitude, point.longitude)
					.then((alt: number) => point.altitude = alt)
				;
			}
			let idx = -1;
			if (this.currentRoute) {
				idx = this.currentRoute.points.map((p: PointName) => p.id).indexOf(point.id);
				if (idx !== -1) this.currentRoute.choosing = idx;
			}
			idx = this.measure.points.map((p: PointName) => p.id).indexOf(point.id);
			if (idx !== -1) this.measure.choosing = idx;
			if (center !== false && point) this.center = {
				latitude: point.latitude,
				longitude: point.longitude,
			};
		},
		setCurrentPlace<T extends string | Place | null | undefined>(
			param: T,
			center?: boolean | undefined,
		) {
			let place = null;
			if (typeof param === 'string') {
				place = this.getPlaceById(param) ?? null;
			} else {
				place = param ?? null;
			}
			this.currentPlace = place;
			if (place) this.setCurrentPoint(place.pointid, center);
		},
		setCurrentRoute<T extends string | Route | null | undefined>(
			param: T,
			center?: boolean | undefined,
		) {
			let route = null;
			if (typeof param === 'string') {
				route = this.getRouteById(param) ?? null;
			} else {
				route = param ?? null;
			}
			this.currentRoute = route;
			if (route.points.length) {
				if (// Damn you all
					typeof route.choosing !== 'number' ||
					!Number.isInteger(route.choosing) ||
					route.choosing < 0 ||
					route.choosing > route.points.length - 1
				) {
					route.choosing = 0;
				}
				this.setCurrentPoint(route.points[route.choosing].id, center);
			}
		},
		setFirstCurrentPlace() {
			if (this.homePlace) {
				this.setCurrentPlace(this.homePlace);
				return;
			}
			let firstPlaceInRoot: Place = null;
			for (const id in this.places) {
				if (this.places[id].folderid === 'root') {
					firstPlaceInRoot = this.places[id];
					break;
				}
			}
			if (!firstPlaceInRoot) this.setCurrentPlace(this.places[Object.keys(this.places)[0]]);
			this.setCurrentPlace(firstPlaceInRoot);
		},

// SEC Inits
 
		restoreObjectsAsLinks() {
			this.refreshing = true;
			this.backup = false;
			this.setHomePlace({
				id: this.user.homeplace ? this.user.homeplace : null,
			});
			this.backup = true;
			if (this.currentPlace) {
				let place: Place = null;
				if (this.commonPlaces[this.currentPlace.id])
					place = this.commonPlaces[this.currentPlace.id];
				if (this.places[this.currentPlace.id])
					place = this.places[this.currentPlace.id];
				this.setCurrentPlace(place);
			}
			this.refreshing = false;
		},
		updateSavedStatus() {
			const pkg = this.getAllModifiedPackage;
			this.saved = (
				pkg.points.length === 0 && 
				pkg.places.length === 0 && 
				pkg.routes.length === 0 && 
				pkg.folders.length === 0
			);
		},
		async setServerConfig() {
			try {
				const { data } = await axios.get(
					'/backend/get_config.php?useruuid=' +
					sessionStorage.getItem('places-useruuid')
				);
				this.serverConfig = data;
			} catch (error) {
				console.error(error);
				this.setMessage(this.t.m.popup.cannotGetData);
				this.serverConfig = null;
			}
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
			try {
				const { data } = await axios.post(
					'/backend/get_users.php',
					Array.isArray(ids) ? { users: ids } : null
				);
				for (let idx = 0; idx < data.length; idx++) {
					this.users[data[idx].id] = {
						login: data[idx].login,
						name: data[idx].name,
					};
				}
			} catch (error) {
				console.error(error);
			}
		},
		async setUser() {
			try {
				const { data } = await axios.get(
					'/backend/get_account.php?id=' +
					sessionStorage.getItem('places-useruuid')
				);
				this.user = data;
			} catch (error) {
				console.error(error);
				this.setMessage(this.t.m.popup.cannotGetData);
				this.user = null;
			}
		},
		async setPlaces(payload?: { mime: string, text: string | ArrayBuffer }) {
			// If reading from database, not importing
			if (!payload) {
				try {
					const { data } = await axios.get(
						'/backend/get_places.php?id=' +
						sessionStorage.getItem('places-useruuid')
					);
					for (
						const folder of
						Object.values(data.folders) as Folder[]
					) {
						if (folder.parent === null) {
							folder.parent = 'root';
						}
					}
					this.placesReady({
						points: Object.assign({}, data.points),
						places: Object.assign({}, data.places),
						commonPlaces: Object.assign({}, data.common_places),
						folders: Object.assign({}, data.folders),
					});
					this.backup = false;
					this.setHomePlace({
						id: this.user.homeplace ? this.user.homeplace : null,
					});
					this.backup = true;
					this.setFirstCurrentPlace();
					if (this.currentPlace) {
						this.updateMap({
							latitude: this.points[this.currentPlace.pointid].latitude,
							longitude: this.points[this.currentPlace.pointid].longitude,
						});
					}
				} catch (error) {
					console.error(error);
					this.setMessage(this.t.m.popup.cannotGetDataFromDb);
					this.placesReady({
						points: {},
						places: {},
						commonPlaces: {},
						folders: {},
					});
				}
				return;
			}
/* TODO Completely rewrite to take into account the new architecture (upserts, etc.)
			// If importing from file.
			// A payload parameter is present and is an object:
			// {text: <file’s content as a text>, type: <file’s MIME-type>}

			const parseJSON = (text: string) => {
				try {
					const result =
						<Record<string, Array<Place | Route | Point | Folder>>>
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
					// Updating the tree branch of folders for imported places
					// and get an ID of a folder for the importing place
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

									// Checking if such a folder already exists
									// in the tree and user has rights
									// to add a folder.

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
										this.upsertFolder({
											what: newFolder,
											where: this.folders,
										});
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
							this.upsertFolder({
								what: parsed.tree,
								where: this.folders,
							});
							break;
						default :
							this.setMessage(`
								o_O
							`);
							return false;
					}
					for (const place of (parsed.places as Array<Place>)) {

						// Checking if such a place already exists
						// and user has rights to add a place.

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
								this.upsertPoint({ what: newPoint });
							}
							this.upsertPlace({ object: newPlace });
						} else {
							this.setMessage(
								this.t.m.popup.placesCountExceeded
							);
						}
					}
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
*/
		},

// SEC DB saving
 
		setObjectSaved(object: User | Group | Point | Place | Route | Folder) {
			object.added = false;
			object.deleted = false;
			object.updated = false;
		},
		savedToDB(payload: DataToDB) {
			for (const point of payload.points ?? []) this.setObjectSaved(point);
			for (const place of payload.places ?? []) this.setObjectSaved(place);
			for (const route of payload.routes ?? []) this.setObjectSaved(route);
			for (const folder of payload.folders ?? []) this.setObjectSaved(folder);
			this.saved = true;
		},

// SEC Checkers
 
		isMeasurePoint(id: string) {
			return this.measurePointIds.has(id);
		},
		isRoutePoint(id: string, route: Route) {
			return this.routePointIds(route).has(id);
		},

// SEC Other

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
		deleteMessage(index: number) {
			this.messages.splice(index, 1);
		},
		setMouseOverMessages(over?: boolean) {
			this.mouseOverMessages = (over === false ? false : true);
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
			this.routes = {};
		},
		buildTrees() {
			const tree = plainToTree({ plain: this.foldersFlat, live: true, keep: true });
			if (!tree) return;
			this.tree.children = {};
			this.treeRoutes.children = {};
			this.folders = tree;
			for (const id in this.folders) {
				if (this.folders[id].parent === 'root') {
					this.tree.children[id] = this.folders[id];
					continue;
				}
				if (this.folders[id].parent === 'routesroot') {
					this.treeRoutes.children[id] = this.folders[id];
					continue;
				}
			}
			this.tree.userid = this.treeRoutes.userid = this.user ? this.user.id : null;
			this.tree.name = this.t.i.captions.rootFolder;
			this.treeRoutes.name = this.t.i.captions.rootRoutesFolder;
		},
		placesReady(payload: Record<string, any>) {
			const { points, places, commonPlaces, routes, commonRoutes, folders, what } = payload;

			this.points = points ? points : {};
			this.places = places ? places : {};
			this.commonPlaces = commonPlaces ? commonPlaces : {};
			this.routes = routes ? routes : {};
			this.commonRoutes = commonRoutes ? commonRoutes : {};
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
			for (const route of (Object.values(this.routes) as Route[])) {
				route.type = 'route';
				route.added = added;
				route.deleted = deleted;
				route.updated = updated;
				route.show = true;
				route.common = Boolean(route.common);
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
		modifyRoutes(routes: Record<string, Route>) {
			this.routes = routes;
		},
		modifyCommonPlaces(commonPlaces: Record<string, Place>) {
			this.commonPlaces = commonPlaces;
		},
		modifyCommonRoutes(commonRoutes: Record<string, Route>) {
			this.commonRoutes = commonRoutes;
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
		distanceBetweenPoints(ids: string[], where?: string): number {
			if (ids.length < 2) return 0;
			const points = where ? this[where] : this.pointsAll;
			let distance = 0;
			for (let i = 1; i < ids.length; i++) {
				if (!points[ids[i]]) continue;
				distance += distanceOnSphere(
					points[ids[i]].latitude,
					points[ids[i]].longitude,
					points[ids[i - 1]].latitude,
					points[ids[i - 1]].longitude,
					constants.earthRadius
				);
			}
			return distance;
		},
		measureDistance(
			ids: string[] = this.measure.points.map((p: PointName) => p.id),
			takeIntoaltitudeDeltas: boolean = false,
		): number {
			if (ids.length < 2) return 0;
			let distance = 0;
			for (let i = 0; i < ids.length - 1; i++) {
				const p1 = this.getPointById(ids[i]);
				const p2 = this.getPointById(ids[i + 1]);
				if (p1 && p2) {
					const d = distanceOnSphere(
						p1.latitude, p1.longitude,
						p2.latitude, p2.longitude,
						constants.earthRadius
					);
					if (
						takeIntoaltitudeDeltas &&
						p1.altitude !== null &&
						p2.altitude !== null
					) {
						const deltaH = Math.abs(p1.altitude - p2.altitude) / 1000;
						distance += Math.sqrt(Math.pow(d, 2) + Math.pow(deltaH, 2));
					} else {
						distance += d;
					}
				}
			}
			return distance;
		},
		changeLang(lang) {
			const getLang = () => import(`@/lang/${lang}.ts`);
			getLang().then(l => {
				this.lang = lang;
				this.t = l.getT();
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
			this.stateBackups.splice(++this.stateBackupsIndex);
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
		getPointById(id: string) {
			if (Object.hasOwn(this.points, id)) return this.points[id];
			if (Object.hasOwn(this.temps, id)) return this.temps[id];
			return null;
		},
		getPlaceById(id: string) {
			if (Object.hasOwn(this.places, id)) return this.places[id];
			if (Object.hasOwn(this.commonPlaces, id)) return this.commonPlaces[id];
			return null;
		},
		getRouteById(id: string) {
			if (Object.hasOwn(this.routes, id)) return this.routes[id];
			if (Object.hasOwn(this.commonRoutes, id)) return this.commonRoutes[id];
			return null;
		},
		getNeighboursSrts(id: string, type: string, top?: boolean) {
			let fellows: Record<string, Folder | Place | Route> = this[type + 's'];
			let neighbours = Object.values(fellows);
			let item = fellows[id];
			if (!fellows[id] && type === 'folder') {
				fellows = id === 'routesroot'
					? this.treeRoutes.children
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
		async setHomePlace({ id, todb = false }: { id: string | null; todb?: boolean; }) {
			if (this.places[id]) {
				this.homePlace = this.places[id];
				this.user.homeplace = id;
				if (todb !== false) emitter.emit('homeToDB', id);
			} else {
				this.homePlace = null;
				this.user.homeplace = null;
				if (todb !== false) emitter.emit('homeToDB', null);
			}
			this.backupState();
		},
		async getAltitude (lat: number, lon: number): Promise<number | null> {
			try {
				const { data } = await axios.get(
					`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
				);
				const alt = Number(data.elevation);
				return isNaN(alt) ? null : alt;
			} catch {
				return null;
			}
		},
		wherePointIsUsed(id: string) {
			let uses: (Place | Route)[] = [];
			uses.push(
				...(Object.values(this.places) as Place[]).filter(place =>
					place.pointid === id
				),
				...(Object.values(this.routes) as Route[]).filter(route =>
					route.points.find(p => p.id === id)
				),
			);
			return uses;
		},
		addPointToPoints({
			point = this.currentPoint,
			where,
		}: {
			point: Point;
			where?: Route | Measure;
		}) {
			if (!where) {
				if (this.mode === 'routes' && this.currentRoute) where = this.currentRoute;
				else if (this.mode === 'measure') where = this.measure;
				else return;
			}
			const numbers = where.points
				.filter(p => /^\d+$/.test(p.name))
				.map(p => Number(p.name));
			const name = (Math.max(0, ...numbers) + 1).toString();
			where.choosing = where.points.length;
			where.points[where.choosing] = {
				id: point.id,
				name: name,
			};
		},
		removePointFromPoints(
			point: Point = this.currentPoint,
			entity: Route | Measure = this.measure,
		) {
			let idx = entity.points.map(p => p.id).indexOf(point.id);
			if (idx === -1) return;
			entity.points.splice(idx, 1);
			if (entity.choosing > entity.points.length - 1) {
				entity.choosing = entity.points.length - 1;
			}
		},
		async removeRoutePoint({
			point,
			route = this.currentRoute,
		}: {
			point: Point;
			route?: Route;
		}) {
			let idx = null;
			for (let i = 0; i < route.points.length; i++) {
				if (route.points[i].id === point.id) {
					idx = i;
					break;
				}
			}
			if (idx === null) return;
			route.points.splice(idx, 1);
			if (idx > route.points.length - 1) idx =  route.points.length - 1;
			this.backupState();
		},
		async changeFolder(payload: Record<string, any>) {
			for (const key in payload.change) {
				payload.folder[key] = payload.change[key];
			}
			payload.folder.updated = true;
			this.saved = false;
			this.backupState();
		},
		async changePoint(payload: Record<string, any>) {
			const coordsChanged =
				Object.hasOwn(payload.change, 'latitude') ||
				Object.hasOwn(payload.change, 'longitude')
			;
			const altitudeMissing =
				payload.point.altitude === null ||
				payload.point.altitude === undefined
			;
			Object.assign(payload.point, payload.change);
			if (coordsChanged || altitudeMissing) {
				const altitude = await this.getAltitude(
					payload.point.latitude,
					payload.point.longitude,
				);
				payload.point.altitude = altitude;
				payload.change.altitude = altitude;
			}
			payload.point.updated = true;
			this.saved = false;
			this.backupState();
		},
		changePlace(payload: Record<string, any>) {
			for (const key in payload.change) {
				payload.place[key] = key === 'srt'
					? (Number(payload.change[key]) || 0)
					: payload.change[key]
				;
			}
			payload.place.updated = true;
			this.saved = false;
			this.backupState();
		},
		async changeRoute(payload: Record<string, any>) {
			for (const key in payload.change) {
				payload.route[key] = key === 'srt'
					? (Number(payload.change[key]) || 0)
					: payload.change[key]
				;
			}
			payload.route.updated = true;
			this.saved = false;
			this.backupState();
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
		commonRoutesShowHide(show? : boolean) {
			this.commonRoutesShow = show === undefined
				? !this.commonRoutesShow
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
				object: Place | Route | Folder,
				show: number | boolean
			) => {
				switch (object.type) {
					case 'place':
						object['geomark'] = show;
						return;
					case 'route':
						object['geomarks'] = show;
						return;
					case 'folder':
						object['geomarks'] = !show ? 0 : 1;
						for (const item of
							Object.values({ ...this.places, ...this.routes })
								.filter((item: Place | Route) => {
									if (
										item.folderid === object.id ||
										item.folderid === null &&
										(
											object.id === 'root' ||
											object.id === 'routesroot'
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
			const showHideParentsGeomarks = (object: Place | Route | Folder) => {
				const objectParentKey =
					Object.hasOwn(object, 'folderid') ? 'folderid' : 'parent'
				;
				let neibours =
					Object.values({ ...this.places, ...this.routes, ...this.folders })
						.filter(
							(neibour: Place | Route | Folder) => {
								const neibourParentKey =
									Object.hasOwn(neibour, 'folderid') ? 'folderid' : 'parent'
								;
								if (
									neibour[neibourParentKey] === object[objectParentKey] ||
									(
										neibour[neibourParentKey] === 'root' ||
										neibour[neibourParentKey] === 'routesroot' ||
										neibour[neibourParentKey] === null
									) && (
										object[objectParentKey] === 'root' ||
										object[objectParentKey] === 'routesroot' ||
										object[objectParentKey] === null
									)
								) {
									return true;
								} else {
									return false;
								}
							}
						) as Array<Place | Route | Folder>
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
					this.treeRoutes[object[objectParentKey]] ??
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
						object['parent'] === 'routesroot' ||
						object.type === 'route' && object['folderid'] === null
					) {
						this.treeRoutes.geomarks = Number(visibility);
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
		pointsAll() {
			return { ...this.points, ...this.temps };
		},
		sharingPointsIds() {
			let usingPointsIds: string[] = [];
			usingPointsIds = usingPointsIds.concat(
				Object.values(this.places).map((place: Place) => place.pointid)
			);
			for (const route of Object.values(this.routes)) {
				usingPointsIds = usingPointsIds.concat(
					(route as Route).points.map(p =>
						this.places[p.id] ? this.places[p.id].pointid : p.id
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
		measurePointIds() {
			return new Set(this.measure.points.map((p: PointName) => {
				if (p.id) return p.id;
				else if (p.point) return this.getPointById(p.point.id);
			}));
		},
		routePointIds: () => {
			return (route: Route) => new Set(route.points.map((p: PointName) => p.id));
		},
		tempIndexById: state => {
			return (id: string) => Object.keys(state.temps).indexOf(id);
		},
		routePoints() {
			return (route: Route): Point[] => {
				if (route === null) return [];
				let points: Point[] = [];
				for (const p of route.points) {
					if (p.id in this.points) points.push(this.points[p.id]);
						else if (p.id in this.temps) points.push(this.temps[p.id]);
				}
				return points;
			}
		},
		// Since the route points can be either its own or independent
		// or points of other places, we collect them all in one array
		routeAllPointsArray() {
			return (route: Route): { point: Point, of: string }[] => {
				let points: { point: Point, of: string }[] = [];
				let of: string;
				for (const p of route.points) {
					if (p.id in this.temps) of = 'temps';
					else if (
						Object.values(this.places).map((p: Place) => p.pointid)
							.includes(p.id)
					) {
						of = 'places';
					}
					points.push({
						point: this.points[p.id],
						of: of,
					});
				}
				return points;
			}
		},
		getPointCoordsArray() {
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
					coords.push([ point.latitude, point.longitude ]);
				}
				return coords;
			}
		},
		lonelyTemps(): Point[] {
			if (!this.tempsShow.show) return [];
			const ids = new Set(this.measure.points.map((p: PointName) => p.id));
			return Object.values(this.temps).filter(
				(temp): temp is Point => !ids.has((temp as Point).id)
			);
		},
		distance(): number {
			return this.measureDistance();
		},
		getAllModifiedPackage(): DataToDB {
			return {
				points: Object.values<Point>(this.points).filter(i =>
					(i.added || i.updated || i.deleted) && !(i.added && i.deleted)
				),
				places: Object.values<Place>(this.places).filter(i =>
					(i.added || i.updated || i.deleted) && !(i.added && i.deleted)
				),
				routes: Object.values<Route>(this.routes).filter(i =>
					(i.added || i.updated || i.deleted) && !(i.added && i.deleted)
				),
				folders: Object.values<Folder>(this.folders).filter(i =>
					(i.added || i.updated || i.deleted) && !(i.added && i.deleted)
				),
			};
		},
	},
});

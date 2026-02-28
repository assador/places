import { defineStore } from 'pinia';
import {
	AppendMode,
	FirstShow,
	PointName,
	User,
	Entity,
	Point,
	Place,
	Route,
	Folder,
	Tree,
	DataToDB,
	Measure,
	DragEntityPayload,
} from '../types';
import {
	emitter,
	constants,
	makeChildren,
	distanceOnSphere,
/* TODO Uncomment when importing from file is rewrited
	formFolderForImported,
*/
} from '@/shared';
import api from '@/api';
import { t } from '@/lang/ru';

export interface IMainState {
	activeMapIndex: number,
	backup: boolean,
	busyCount: number,
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
	currentDrag: DragEntityPayload,
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
	messagesMouseOver: boolean,
	messagesInterval: number | null,
	messagesTimeout: number | null,
	mode: string,
	newEntityPointId: string | null,
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
	treeParams: Record<string, Tree>,
	user: User | null,
	users: Record<string, User>,
	zoom: number,
}

// Прямо над defineStore
const isPoint = (obj: any): obj is Point => obj?.type === 'point';
const isPlace = (obj: any): obj is Place => obj?.type === 'place';
const isRoute = (obj: any): obj is Route => obj?.type === 'route';
// const isFolder = (obj: any): obj is Folder => obj?.type === 'folder';

export const useMainStore = defineStore('main', {
	state: (): IMainState => ({
		activeMapIndex: 0,
		backup: true,
		busyCount: 0,
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
		currentDrag: null,
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
		messagesMouseOver: false,
		messagesInterval: null,
		messagesTimeout: null,
		mode: 'normal',
		newEntityPointId: null,
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
		treeParams: {
			places: {
				context: 'places',
				open: false,
			},
			routes: {
				context: 'routes',
				open: false,
			},
		},
		user: null,
		users: {},
		zoom: Number(constants.map.initial.zoom),
	}),

	persist: true,

	actions: {

// SEC Factories

		_defaultPoint(): Point {
			return {
				type: 'point',
				id: crypto.randomUUID(),
				userid: this.user?.id,
				latitude: this.center.latitude,
				longitude: this.center.longitude,
				altitude: null,
				time: new Date().toISOString().slice(0, -5),
				common: false,
				enabled: true,
				show: true,
				added: false,
				deleted: false,
				updated: false,
			};
		},
		_defaultPlace(): Place {
			const nextSrt = Object.values(this.places as Record<string, Place>)
				.filter(f => !f.folderid)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			return {
				type: 'place',
				id: crypto.randomUUID(),
				userid: this.user?.id,
				folderid: null,
				name: '',
				description: '',
				pointid: '',
				link: '',
				time: new Date().toISOString().slice(0, -5),
				images: {},
				srt: nextSrt,
				geomark: true,
				common: false,
				enabled: true,
				show: true,
				added: false,
				deleted: false,
				updated: false,
			};
		},
		_defaultRoute(): Route {
			const nextSrt = Object.values(this.routes as Record<string, Route>)
				.filter(f => !f.folderid)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			return {
				type: 'route',
				id: crypto.randomUUID(),
				userid: this.user?.id,
				folderid: null,
				points: [],
				choosing: null,
				name: '',
				description: '',
				link: '',
				time: new Date().toISOString().slice(0, -5),
				images: {},
				srt: nextSrt,
				geomarks: 1,
				common: false,
				enabled: true,
				show: true,
				added: false,
				deleted: false,
				updated: false,
			};
		},
		_defaultFolder(): Folder {
			const nextSrt = Object.values(this.folders as Record<string, Folder>)
				.filter(f => !f.parent && f.context === 'places')
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			return {
				type: 'folder',
				id: crypto.randomUUID(),
				userid: this.user?.id,
				parent: null,
				context: 'places',
				name: '',
				description: '',
				srt: nextSrt,
				geomarks: 1,
				builded: false,
				common: false,
				open: false,
				enabled: true,
				show: true,
				added: false,
				deleted: false,
				updated: false,
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
					this.setMessage(this.t.m.popup.pointsCountExceeded, 3);
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
					this.newEntityPointId = point.id;
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
					this.newEntityPointId = point.id;
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

			const folderId = props?.folderid || object?.folderid || null;
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
					this.setMessage(this.t.m.popup.placesCountExceeded, 3);
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

			const folderId = props?.folderid || object?.folderid || null;
			const nextSrt = Object.values(where)
				.filter(f => f.folderid === folderId)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			if (mode === 'new' || mode === 'clone') {
				// Check routes limit
				if (
					!this.user?.testaccount &&
					this.serverConfig.rights.routescount > 0 &&
					Object.keys(where).length >= this.serverConfig.rights.routescount
				) {
					this.setMessage(this.t.m.popup.routesCountExceeded, 3);
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
		} = {}): Folder | undefined {

			let folder: Folder;

			const parentId = props?.parent || object?.parent || null;
			const nextSrt = Object.values(where)
				.filter(f => f.parent === parentId)
				.reduce((max, f) => Math.max(max, f.srt || 0), 0) + 1
			;
			if (mode === 'new') {
				// Check folders limit
				if (
					!this.user?.testaccount &&
					this.serverConfig.rights.folderscount > 0 &&
					Object.keys(where).length >= this.serverConfig.rights.folderscount
				) {
					this.setMessage(this.t.m.popup.foldersCountExceeded, 3);
					return undefined;
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
			this.saved = false;
			this.backupState();
			return folder;
		},

// SEC Deleting Entities

		deleteObjects(objects: Record<string, Point | Place | Route | Folder>) {
			Object.values(objects).forEach(obj => {
				obj.deleted = true;
			});
			const pointsToCheck = new Set<string>();
			Object.values(objects).forEach(obj => {
				if (isPlace(obj)) {
					pointsToCheck.add(obj.pointid);
				} else if (isRoute(obj)) {
					obj.points.forEach(p => {
						pointsToCheck.add(this.places[p.id]?.pointid || p.id);
					});
				} else if (isPoint(obj)) {
					pointsToCheck.add(obj.id);
				}
			});
			pointsToCheck.forEach(pid => {
				const isPointStillNeeded = 
					Object.values<Place>(this.places).some(
						p => p.pointid === pid && !p.deleted
					) ||
					Object.values<Route>(this.routes).some(
						r => !r.deleted && r.points.some(rp => (
							this.places[rp.id]?.pointid || rp.id) === pid
						)
					)
				;
				if (!isPointStillNeeded && this.points[pid]) {
					this.points[pid].deleted = true;
				}
			});
			this.cleanupRoutesFromDeletedPoints();
			this.fixCurrentsAfterDelete();
			this.updateSavedStatus();
			this.backupState();
		},
		cleanupRoutesFromDeletedPoints() {
			const deletedPointIds = new Set(
				Object.values<Point>(this.points)
					.filter(p => p.deleted)
					.map(p => p.id)
			);
			if (deletedPointIds.size === 0) return;
			Object.values<Route>(this.routes).forEach(route => {
				if (route.deleted) return;
				const initialLength = route.points.length;
				route.points = route.points.filter(p => {
					const actualPid = this.places[p.id]?.pointid || p.id;
					return !deletedPointIds.has(actualPid);
				});
				if (route.points.length !== initialLength) {
					route.updated = true;
				}
			});
		},
		fixCurrentsAfterDelete() {
			if (this.currentPlace?.deleted) {
				const fallbackId =
					(this.homePlace && !this.homePlace.deleted) 
						? this.homePlace.id
						: (
							Object.values<Place>(this.places).find(
								p => !p.deleted
							) || null
						)
				;
				this.setCurrentPlace(fallbackId);
			}
			if (this.currentRoute?.deleted) {
				this.setCurrentRoute(
					Object.values<Route>(this.routes).find(
						r => !r.deleted
					) || null
				);
			}
			if (this.currentPoint?.deleted) {
				this.setCurrentPoint(null);
			}
		},
		prepareFolderDelete(folderId: string, mode: string) {
			const toDelete: Record<string, Place | Route | Folder> = {};
			const rootFolder = this.folders[folderId];
			if (!rootFolder) return {};
		
			const collectRecursive = (fId: string) => {
				const folder = this.folders[fId];
				if (!folder) return;
				if (folder.parent !== null) toDelete[fId] = folder;
		
				Object.values<Place>(this.places).forEach(p => {
					if (p.folderid === fId) toDelete[p.id] = p;
				});
				Object.values<Route>(this.routes).forEach(r => {
					if (r.folderid === fId) toDelete[r.id] = r;
				});
				Object.values<Folder>(this.folders).forEach(subFolder => {
					if (subFolder.parent === fId) {
						collectRecursive(subFolder.id);
					}
				});
			};

			if (mode === 'delete') {
				collectRecursive(folderId);
			} else {
				if (rootFolder.parent !== null) toDelete[folderId] = rootFolder;
				Object.values<Place>(this.places).forEach(p => {
					if (p.folderid === folderId) {
						p.folderid = null;
						p.updated = true;
					}
				});
				Object.values<Route>(this.routes).forEach(r => {
					if (r.folderid === folderId) {
						r.folderid = null;
						r.updated = true;
					}
				});
				Object.values<Folder>(this.folders).forEach(f => {
					if (f.parent === folderId) {
						f.parent = null;
						f.updated = true;
					}
				});
			}
			return toDelete;
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
			for (const id in this.temps) {
				this.deleteTemp(id);
			}
		},
		deleteImages(
			{ imageIds, entity } :
			{ imageIds: string[]; entity: Place | Route; }
		) {
			if (!entity.images) return;
			let updated = false;
			for (const id of imageIds) {
				if (entity.images[id]) {
					delete entity.images[id];
					updated = true;
				}
			}
			if (updated) {
				entity.updated = true;
				this.saved = false;
				this.backupState();
			}
		},

// SEC Changing Entities

		async changePoint(
			{ entity, change }: { entity: Point; change: Partial<Point>; }
		) {
			const coordsChanged =
				Object.hasOwn(change, 'latitude') ||
				Object.hasOwn(change, 'longitude')
			;
			const altitudeMissing =
				entity.altitude === null ||
				entity.altitude === undefined
			;
			Object.assign(entity, change);
			if (coordsChanged || altitudeMissing) {
				const altitude = await this.getAltitude(
					entity.latitude,
					entity.longitude,
				);
				entity.altitude = altitude;
				change.altitude = altitude;
			}
			entity.updated = true;
			if (this.newEntityPointId === entity.id) {
				this.newEntityPointId = null;
			}
			this.saved = false;
			this.backupState();
		},
		changePlace(
			{ entity, change }: { entity: Place; change: Partial<Place>; }
		) {
			for (const key in change) {
				entity[key] = key === 'srt'
					? (Number(change[key]) || 0)
					: change[key]
				;
			}
			entity.updated = true;
			this.saved = false;
			this.backupState();
		},
		changeRoute(
			{ entity, change }: { entity: Route; change: Partial<Route>; }
		) {
			for (const key in change) {
				entity[key] = key === 'srt'
					? (Number(change[key]) || 0)
					: change[key]
				;
			}
			entity.updated = true;
			this.saved = false;
			this.backupState();
		},
		changeFolder(
			{ folder, change }: { folder: Folder; change: Partial<Folder>; }
		) {
			for (const key in change) {
				folder[key] = change[key];
			}
			folder.updated = true;
			this.saved = false;
			this.backupState();
		},

// SEC Collecting Points

		addPointToPoints({
			point = this.currentPoint,
			entity,
		}: {
			point: Point;
			entity?: Route | Measure;
		}) {
			if (!entity) {
				if (this.mode === 'routes' && this.currentRoute) {
					entity = this.currentRoute;
				} else if (this.mode === 'measure') {
					entity = this.measure;
				} else {
					return;
				}
			}
			const numbers = entity.points
				.filter(p => /^\d+$/.test(p.name))
				.map(p => Number(p.name));
			const name = (Math.max(0, ...numbers) + 1).toString();
			entity.choosing = entity.points.length;
			entity.points[entity.choosing] = {
				id: point.id,
				name: name,
			};
			// In routes mode, add the Point to the points dict
			// if it is not already there (for example, if the Point is temp)
			// and update the current route:
			if (this.mode === 'routes' && !Object.hasOwn(this.points, point.id)) {
				this.points[point.id] = point;
				if (Object.hasOwn(this.temps, point.id)) delete this.temps[point.id];
				this.points[point.id].added = true;
				(entity as Route).updated = true;
			}
		},
		removePointFromPoints({
			point = this.currentPoint,
			entity,
		}: {
			point: Point;
			entity?: Route | Measure;
		}) {
			if (!entity) {
				if (this.mode === 'routes' && this.currentRoute) {
					entity = this.currentRoute;
				} else if (this.mode === 'measure') {
					entity = this.measure;
				} else {
					return;
				}
			}
			const idx = entity.points.map(p => p.id).indexOf(point.id);
			if (idx === -1) return;
			entity.points.splice(idx, 1);
			if (entity.choosing > entity.points.length - 1) {
				entity.choosing = entity.points.length - 1;
			}
		},
		removeRoutePoint({
			point = this.currentPoint,
			route = this.currentRoute,
		}: {
			point: Point;
			route: Route;
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
			if (idx > route.points.length - 1) idx = route.points.length - 1;
			this.backupState();
		},
		wherePointIsUsed(id: string) {
			const uses: (Place | Route)[] = [];
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

// SEC Inits

		unload() {
			this.refreshing = true;
			this.reset();
			localStorage.clear();
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
			this.messagesMouseOver = false;
			this.messagesInterval = null,
			this.messagesTimeout = null,
			this.serverConfig = null;
			this.routes = {};
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
				folder.open = false;
			}
		},
		async setServerConfig() {
			try {
				const { data } = await api.get(
					'get_config.php?useruuid=' +
					localStorage.getItem('places-useruuid')
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
				const { data } = await api.post(
					'get_users.php',
					Array.isArray(ids) ? { users: ids } : null,
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
				const { data } = await api.get(
					'get_account.php?id=' +
					localStorage.getItem('places-useruuid')
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
					const { data } = await api.get(
						'get_entities.php?id=' +
						localStorage.getItem('places-useruuid')
					);
					this.placesReady({
						points: Object.assign({}, data.points),
						places: Object.assign({}, data.places),
						routes: Object.assign({}, data.routes),
						folders: Object.assign({}, data.folders),
						commonPlaces: Object.assign({}, data.common_places),
					});
					this.backup = false;
					this.setHomePlace({
						id: this.user.homeplace ? this.user.homeplace : null,
					});
					this.backup = true;
					this.setCurrentRoute(Object.values(this.routes)[0] ?? null);
					this.setFirstCurrentPlace();
				} catch (error) {
					console.error(error);
					this.setMessage(this.t.m.popup.cannotGetDataFromDb);
					this.placesReady({
						points: {},
						places: {},
						routes: {},
						folders: {},
						commonPlaces: {},
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
				if (this.trees.places.imported) {
					result.tree = this.trees.places.imported;
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
						userid: localStorage.getItem('places-useruuid'),
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
						userid: localStorage.getItem('places-useruuid'),
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
											userid: localStorage.getItem('places-useruuid') as string,
											name: folder.name,
											description: folder.description,
											id: folder.id,
											srt: Number(folder.srt) || 0,
											parent: folder.parent,
											open: false,
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
										, 3);
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
							`, 3);
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
								userid: localStorage.getItem('places-useruuid') as string,
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
							, 3);
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
					, 3);
					return false;
			}
			addImported(payload.mime, parsed);
		*/
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
			let idx: number;
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
			let place: Place | null;
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
			let route: Route | null;
			if (typeof param === 'string') {
				route = this.getRouteById(param) ?? null;
			} else {
				route = param ?? null;
			}
			this.currentRoute = route;
			if (route?.points.length) {
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
				if (!this.places[id].folderid) {
					firstPlaceInRoot = this.places[id];
					break;
				}
			}
			if (!firstPlaceInRoot) this.setCurrentPlace(this.places[Object.keys(this.places)[0]]);
			this.setCurrentPlace(firstPlaceInRoot);
		},
		async setHomePlace({
			id,
			todb = false,
		}: {
			id: string | null;
			todb?: boolean;
		}) {
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

// SEC DB
 
		savedToDB(payload: DataToDB) {
			const collections = {
				points: this.points,
				places: this.places,
				routes: this.routes,
				folders: this.folders,
			};
			for (const [ key, stateDict ] of Object.entries(collections)) {
				const items = payload[key as keyof DataToDB];
				if (!items) continue;
				items.forEach((item: any) => {
					if (item.deleted) {
						delete stateDict[item.id];
					} else {
						const stateItem = stateDict[item.id];
						if (stateItem) {
							stateItem.added = false;
							stateItem.updated = false;
							stateItem.deleted = false;
						}
					}
				});
			}
			this.updateSavedStatus();
			this.stateBackups = [];
			this.stateBackupsIndex = -1;
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

// SEC Backup

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
		replaceState(payload: IMainState) {
			this.$state = payload;
			this.changeLang(this.lang);
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
		restoreObjectsAsLinks() {
			this.refreshing = true;
			this.backup = false;
			this.setHomePlace({
				id: this.user.homeplace ? this.user.homeplace : null,
			});
			if (this.currentPlace) {
				let place: Place = null;
				if (this.commonPlaces[this.currentPlace.id])
					place = this.commonPlaces[this.currentPlace.id];
				if (this.places[this.currentPlace.id])
					place = this.places[this.currentPlace.id];
				this.setCurrentPlace(place);
			}
			if (this.currentRoute) {
				let route: Route = null;
				if (this.routes[this.currentRoute.id]) {
					route = this.routes[this.currentRoute.id];
				}
				this.setCurrentRoute(route); 
			}
			if (this.currentPoint) {
				let point: Point = null;
				if (this.points[this.currentPoint.id])
					point = this.points[this.currentPoint.id];
				if (this.temps[this.currentPoint.id])
					point = this.temps[this.currentPoint.id];
				this.setCurrentPoint(point); 
			}
			this.backup = true;
			this.refreshing = false;
		},

// SEC Checkers
 
		isMeasurePoint(id: string) {
			return this.measurePointIds.has(id);
		},
		isRoutePoint(id: string, route: Route) {
			return this.routePointIds(route).has(id);
		},

// SEC Markers

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
						object['geomark'] = Boolean(show);
						return;
					case 'route':
						object['geomarks'] = !show ? 0 : 1;
						return;
					case 'folder':
						object['geomarks'] = !show ? 0 : 1;
						for (const item of
							Object.values({ ...this.places, ...this.routes })
								.filter((item: Place | Route) => {
									if (
										item.folderid === object.id ||
										item.folderid === null &&
										!object['parent']
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
				const neibours =
					Object.values({ ...this.places, ...this.routes, ...this.folders })
						.filter(
							(neibour: Place | Route | Folder) => {
								const neibourParentKey =
									Object.hasOwn(neibour, 'folderid')
										? 'folderid' : 'parent'
								;
								if (
									neibour[neibourParentKey] === object[objectParentKey] ||
									neibour[neibourParentKey] === null &&
									object[objectParentKey] === null
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
				const parent: Folder =
					this.folders[object[objectParentKey]] ??
					this.trees.places[object[objectParentKey]] ??
					this.trees.routes[object[objectParentKey]] ??
					null
				;
				if (parent === null) {
					if (
						object['parent'] === null &&
						object['context'] === 'places'  ||
						object.type === 'place' &&
						object['folderid'] === null
					) {
						this.trees.places.geomarks = Number(visibility);
					}
					if (
						object['parent'] === null &&
						object['context'] === 'places'  ||
						object.type === 'place' &&
						object['folderid'] === null
					) {
						this.trees.routes.geomarks = Number(visibility);
					}
					return;
				}
				parent.geomarks = Number(visibility);
				showHideParentsGeomarks(parent);
			}
			showHideSubsGeomarks(payload.object, payload.show);
			showHideParentsGeomarks(payload.object);
		},

// SEC Messages

		setMessage(
			message: string,
			secondsForAll: number = 0,
			secondsForOne: number = 0.5,
		) {
			if (!message) return;
			const messageIndex = this.messages.indexOf(message);
			if (messageIndex === -1) this.messages.push(message);
			clearInterval(this.messagesInterval);
			clearTimeout(this.messagesTimeout);
			if (!this.messagesMouseOver && secondsForAll) {
				this.messagesTimeout = setTimeout(() => {
					if (this.messages.length === 1) {
						this.clearMessages();
						return;
					}
					this.messagesInterval = setInterval(() => {
						if (this.messages.length > 1) {
							this.deleteMessage(this.messages.length - 1);
						} else {
							this.clearMessages();
						}
					}, secondsForOne * 1000);
				}, secondsForAll * 1000);
			}
		},
		deleteMessage(index: number) {
			if (index >= 0 && this.messages[index]) this.messages.splice(index, 1);
		},
		clearMessages(polyupasu: boolean = false) {
			clearInterval(this.messagesInterval);
			clearTimeout(this.messagesTimeout);
			if (polyupasu || !this.messagesMouseOver) this.messages = [];
		},

// SEC Other

		setBusy(busy: boolean = true) {
			if (busy) {
				this.timer = setTimeout(() => { this.busyCount++ }, 200);
			} else {
				clearTimeout(this.timer);
				this.busyCount = Math.max(0, this.busyCount - 1);
			}
		},
		collectModified<T extends Entity>(collection: Record<string, T>): T[] {
			return Object.values(collection).filter(i =>
				(i.added || i.updated || i.deleted) && !(i.added && i.deleted)
			);
		},
		changeLang(lang) {
			const getLang = () => import(`@/lang/${lang}.ts`);
			getLang().then(l => {
				this.lang = lang;
				this.t = l.getT();
				this.trees.places.name = this.t.i.captions.rootFolder;
			});
		},
		async getAltitude (lat: number, lon: number): Promise<number | null> {
			try {
				const { data } = await api.get(
					`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`,
					{ silent: true },
				);
				const alt = Number(data.elevation);
				return isNaN(alt) ? null : alt;
			} catch {
				return null;
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
			const points = where ? this[where] : this.getAllPoints;
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
		folderOpenClose(
			{ folder, open, target }:
			{ folder?: Folder; open?: boolean; target?: any; }
		) {
			const targetOpen = typeof open !== 'undefined'
				? open : !folder.open
			;
			if (folder) {
				if (folder.virtual) {
					this.trees[folder.context].open = targetOpen;
				} else {
					this.folders[folder.id].open = targetOpen;
				}
			}
			if (target) {
				if (targetOpen) {
					target.classList.add('folder_open');
					target.classList.remove('folder_closed');
				} else {
					if (target.classList.contains('folder_open')) {
						target.classList.add('folder_closed');
						target.classList.remove('folder_open');
					} else {
						target.classList.add('folder_open');
						target.classList.remove('folder_closed');
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
		getEntitiesReferencingPoint(pointId: string): Record<string, Place | Route> {
			const entities: Record<string, Place | Route> = {};
			Object.values<Place>(this.places).forEach(p => {
				if (p.pointid === pointId) entities[p.id] = p;
			});
			Object.values<Route>(this.routes).forEach(r => {
				if (r.points.some(p => p.id === pointId)) entities[r.id] = r;
			});
			return entities;
		},
	},

// SEC --- getters

	getters: {
		busy() {
			return this.busyCount > 0;
		},
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
		getAllPoints() {
			return { ...this.points, ...this.temps };
		},
		getPointById() {
			return (id: string) => {
				if (Object.hasOwn(this.points, id)) return this.points[id];
				if (Object.hasOwn(this.temps, id)) return this.temps[id];
				return null;
			}
		},
		getPlaceById() {
			return (id: string) => {
				if (Object.hasOwn(this.places, id)) return this.places[id];
				if (Object.hasOwn(this.commonPlaces, id)) return this.commonPlaces[id];
				return null;
			}
		},
		getRouteById() {
			return (id: string) => {
				if (Object.hasOwn(this.routes, id)) return this.routes[id];
				if (Object.hasOwn(this.commonRoutes, id)) return this.commonRoutes[id];
				return null;
			}
		},
		getNeighboursSrts() {
			return (id: string, type: string, top?: boolean) => {
				let fellows: Record<string, Folder | Place | Route> = this[type + 's'];
				let neighbours: (Folder | Place | Route)[];
				let item = fellows[id];
				if (!fellows[id] && type === 'folder') {
					fellows = id === 'routesroot'
						? this.trees.routes.children
						: this.trees.places.children
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
				if (top) {result.new = !result.previous
					? result.own / 2
					: (result.own - result.previous) / 2 + result.previous;
				} else {result.new = !result.next
					? result.own + 1
					: (result.next - result.own) / 2 + result.own;
				}
				return result;
			}
		},
		getSharedPointIds(): string[] {
			const counts = new Map<string, number>();
			const count = (id: string) => counts.set(id, (counts.get(id) || 0) + 1);

			Object.values<Place>(this.places).forEach(place => count(place.pointid));

			Object.values<Route>(this.routes).forEach(route => {
				route.points.forEach(p => {
					const actualId = this.places[p.id]?.pointid || p.id;
					count(actualId);
				});
			});

			const shared: string[] = [];
			for (const [id, num] of counts) {
				if (num > 1) shared.push(id);
			}
			return shared;
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
				const points: Point[] = [];
				for (const p of route.points) {
					if (p.id in this.points) points.push(this.points[p.id]);
						else if (p.id in this.temps) points.push(this.temps[p.id]);
				}
				return points;
			}
		},
		// Since the route points can be either its own or temporary
		// or points of other places, we collect them all in one array
		routeAllPointsArray() {
			return (route: Route): { point: Point, of: string }[] => {
				const points: { point: Point, of: string }[] = [];
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
		getPointCoords() {
			return (pointId: string): number[] => {
				const point = this.getPointById(pointId);
				return [ point.latitude, point.longitude ];
			}
		},
		getPointsCoords() {
			return (pointIdsArray: string[]): number[][] => {
				const coords: number[][] = [];
				let point: Point;
				for (const id of pointIdsArray) {
					point = this.getPointById(id);
					coords.push([ point.latitude, point.longitude ]);
				}
				return coords;
			}
		},
		getAllModifiedPackage(): DataToDB {
			return {
				points: this.collectModified(this.points),
				places: this.collectModified(this.places),
				routes: this.collectModified(this.routes),
				folders: this.collectModified(this.folders),
			};
		},
		getDistance() {
			return (
				pointIds: string[] = this.measure.points.map((p: PointName) => p.id),
				takeIntoAltitudeDeltas: boolean = false,
			): number => {
				if (pointIds.length < 2) return 0;
				let distance = 0;
				for (let i = 0; i < pointIds.length - 1; i++) {
					const p1 = this.getPointById(pointIds[i]);
					const p2 = this.getPointById(pointIds[i + 1]);
					if (p1 && p2) {
						const d = distanceOnSphere(
							p1.latitude, p1.longitude,
							p2.latitude, p2.longitude,
							constants.earthRadius
						);
						if (
							takeIntoAltitudeDeltas &&
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
			}
		},

// SEC Trees

		childrened() {
			const aliveFolders: Record<string, Folder> = {};
			for (const id in this.folders) {
				if (!this.folders[id].deleted) {
					aliveFolders[id] = this.folders[id];
				}
			}
			return makeChildren(aliveFolders);
		},
		treePlaces() {
			const tree: Folder = this.createFolder({
				virtual: true,
				context: 'places',
				id: null,
				parent: null,
				srt: 20,
				name: this.t.i.captions.places,
				children: {},
			});
			Object.defineProperty(tree, 'open', {
				get: () => this.treeParams.places.open,
				set: (val) => { this.treeParams.places.open = val; },
				enumerable: true,
				configurable: true,
			});
			for (const id in this.childrened) {
				if (
					!this.childrened[id].parent &&
					this.childrened[id].context === 'places'
				) {
					tree.children[id] = this.childrened[id];
				}
			}
			return tree;
		},
		treeRoutes() {
			const tree: Folder = this.createFolder({
				virtual: true,
				context: 'routes',
				id: null,
				parent: null,
				srt: 10,
				name: this.t.i.captions.routes,
				children: {},
			});
			Object.defineProperty(tree, 'open', {
				get: () => this.treeParams.routes.open,
				set: (val) => { this.treeParams.routes.open = val; },
				enumerable: true,
				configurable: true,
			});
			for (const id in this.childrened) {
				if (
					!this.childrened[id].parent &&
					this.childrened[id].context === 'routes'
				) {
					tree.children[id] = this.childrened[id];
				}
			}
			return tree;
		},
		trees() {
			return {
				places: this.treePlaces,
				routes: this.treeRoutes,
			};
		},
	},
});

import {
	Point,
	Place,
	Route,
	Folder,
	PointName,
	AppendMode,
} from '@/types';
import { isPoint, isPlace, isRoute } from '@/guards';
import { emitter } from '@/shared';

export const entityActions = {

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
		silent = false,
	}: {
		object?: Point;
		props?: Partial<Point>;
		where?: Record<string, Point>;
		whom?: Place | Route,
		name?: string,
		description?: string,
		mode?: AppendMode,
		silent?: boolean;
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
				Object.assign(object!, { updated: true, deleted: false }, props);
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
		if (point.altitude === null) {
			this.getAltitude(point.latitude, point.longitude)
				.then((alt: number) => {
					point.altitude = alt;
				})
			;
		}
		if (!silent) {
			this.saved = false;
			this.backupState();
		}
		return point;
	},
	upsertPlace({
		object,
		props,
		where = this.places,
		mode = 'new',
		silent = false,
	}: {
		object?: Place;
		props?: Partial<Place>;
		where?: Record<string, Place>;
		mode?: AppendMode,
		silent?: boolean;
	} = {}): Place {

		let place: Place;
		let point: Point | null;

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
				Object.assign(object!, { updated: true, deleted: false }, props);
				place = object!;
				break;
			case 'new':
				point = props?.pointid ? this.points[props.pointid] : null;
				if (!point) {
					point = this.createPoint({ added: true, ...props });
					this.points[point.id] = point;
				}
				place = this.createPlace({
					pointid: point.id,
					folderid: folderId,
					srt: nextSrt,
					added: true,
					...props,
				});
				where[place.id] = place;
				break;
			case 'clone': {
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
		}
		this.setCurrentPlace(place);
		if (!silent) {
			this.saved = false;
			this.backupState();
		}
		return place;
	},
	upsertRoute({
		object,
		props,
		where = this.routes,
		mode = 'new',
		silent = false,
	}: {
		object?: Route;
		props?: Partial<Route>;
		where?: Record<string, Route>;
		mode?: AppendMode,
		silent?: boolean;
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
				Object.assign(object!, { updated: true, deleted: false }, props);
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
		if (!silent) {
			this.saved = false;
			this.backupState();
		}
		return route;
	},
	upsertFolder({
		object,
		props,
		where = this.folders,
		mode = 'new',
		silent = false,
	}: {
		object?: Folder;
		props?: Partial<Folder>;
		where?: Record<string, Folder>;
		mode?: AppendMode;
		silent?: boolean;
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
				Object.assign(object!, { updated: true, deleted: false }, props);
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
		if (!silent) {
			this.saved = false;
			this.backupState();
		}
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
			toDelete[fId] = folder;

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

// SEC Inspections

	inspectOrphanFolders() {
		Object.values<Folder>(this.folders).forEach(f => {
			if (f.parent && !this.folders[f.parent]) f.parent = null;
		});
	},
	inspectOrphanPlaces() {
		Object.values<Place>(this.places).forEach(p => {
			if (p.folderid && !this.folders[p.folderid]) p.folderid = null;
		});
	},
	inspectOrphanRoutes() {
		Object.values<Route>(this.routes).forEach(r => {
			if (r.folderid && !this.folders[r.folderid]) r.folderid = null;
		});
	},
	resolveId(
		oldId: string,
		idMap: Map<string, string>,
		entityRecord: Record<string, any>,
	): string {
		if (idMap.has(oldId)) return idMap.get(oldId);
		if (entityRecord[oldId]) {
			idMap.set(oldId, oldId);
			return oldId;
		}
		const newId = crypto.randomUUID();
		idMap.set(oldId, newId);
		return newId;
	},

	// SEC Checkers

	isMeasurePoint(id: string) {
		return this.measurePointIds.has(id);
	},
	isRoutePoint(id: string, route: Route) {
		return this.routePointIds(route).has(id);
	},
};

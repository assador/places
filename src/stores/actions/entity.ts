import {
	Mode,
	Point,
	Place,
	Route,
	Folder,
	PointDescription,
	PointInfo,
	AppendMode,
} from '@/types';
import { isPoint, isPlace, isRoute } from '@/guards';
import { useGeolocation } from '@/services/geolocation';

interface UpsertPlaceParams {
	object?: Place;
	props?: Partial<Place> & Partial<Point>;
	where?: Record<string, Place>;
	mode?: AppendMode;
	center?: boolean;
	silent?: boolean;
}

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
		return {
			...this._defaultFolder(),
			...overrides,
		};
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
	} = {}): Point | null {

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
				return null;
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
		if (point.altitude === null) this.setPointAltitude(point);
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
		center = false,
		silent = false,
	}: UpsertPlaceParams = {}): Place | null {

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
				return null;
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
		this.setCurrentPlace(place, center);
		if (!silent) {
			this.saved = false;
			this.backupState();
		}
		return place;
	},
	upsertPlaceFollowing(
		entity: Place | null | undefined,
		params: UpsertPlaceParams = {},
	): Place | null {
		if (!entity) {
			return this.upsertPlace({ ...params, props: { ...params.props } });
		}
		const neighbours = this.getNeighboursSrts(
			entity.id,
			entity.type,
			false,
		);
		const callParams: UpsertPlaceParams = {
			...params,
			props: {
				...params.props,
				folderid: entity.folderid,
				srt: neighbours.new,
			}
		};
		return this.upsertPlace(callParams);
	},
	upsertPlaceFromPointInfo(info: PointInfo | null): Place | null {
		if (!info || !info.point) return null;
		const pointId = info.point.id;
		if (Object.hasOwn(this.temps, pointId)) {
			this.points[pointId] = { ...info.point,	added: true };
			delete this.temps[pointId];
		}
		const upsertParams: UpsertPlaceParams = {
			mode: 'new',
			props: {
				pointid: pointId,
				name: info.name || '',
				description: info.description || '',
			},
		};
		return this.upsertPlaceFollowing(this.currentPlace, upsertParams);
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
	} = {}): Route | null {

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
				return null;
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
	upsertRouteFollowing(entity: Route | null): Route | null {
		if (!entity) {
			return this.upsertRoute();
		}
		const neighbours = this.getNeighboursSrts(
			entity.id,
			entity.type,
			false,
		);
		return this.upsertRoute({
			props: {
				folderid: entity.folderid,
				srt: neighbours.new,
			}
		});
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
	} = {}): Folder | null {

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
				return null;
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
	async upsertEntityWithCurrentLocation(mode: Mode) {
		try {
			const geoLocation = useGeolocation();
			const location = await geoLocation.getLocation();
			const props = {
				latitude: location.latitude,
				longitude: location.longitude,
			};
			if (mode === 'normal') {
				if (this.currentPlace) {
					this.upsertPlaceFollowing(this.currentPlace, { props });
				} else {
					this.upsertPlace({ props });
				}
			} else if (mode === 'routes' && this.currentRoute) {
				this.upsertPoint({
					where: this.points,
					whom: this.currentRoute,
					props,
				});
			} else if (mode === 'measure') {
				const point = this.upsertPoint({
					where: this.temps,
					props,
				});
				this.addPointToPoints({
					point: point,
					entity: this.measure,
				});
			}
			geoLocation.centerTo(location);
		}
		catch (error) {
			this.setMessage(error, 5);
			return error;
		}
	},

// SEC Deleting Entities

	deleteEntities(objects: Record<string, Point | Place | Route | Folder>) {
		const pointsToCheck = new Set<string>();
		for (const id in objects) {
			const obj = objects[id];
			if (isPlace(obj)) {
				pointsToCheck.add(obj.pointid);
			} else if (isRoute(obj)) {
				for (const pd of obj.points) pointsToCheck.add(pd.id);
			} else if (isPoint(obj)) {
				pointsToCheck.add(obj.id);
			}
			obj.deleted = true;
		}
		const refs = this.pointReferences;
		pointsToCheck.forEach(pid => {
			if (!this.points[pid]) return;
			this.points[pid].deleted = (refs.get(pid)?.size || 0) === 0;
		});
		this.cleanupRoutesFromDeletedPoints();
		this.fixCurrentsAfterDelete();
		this.updateSavedStatus();
		this.backupState();
	},
	cleanupRoutesFromDeletedPoints() {
		const deletedPointIds = new Set<string>();
		for (const id in this.points) {
			if (this.points[id].deleted) {
				deletedPointIds.add(id);
			}
		}
		if (deletedPointIds.size === 0) return;
		for (const id in this.routes) {
			const route = this.routes[id];
			if (route.deleted) continue;
			const initialLength = route.points.length;
			route.points = route.points.filter(
				(pd: PointDescription) => !deletedPointIds.has(pd.id)
			);
			if (route.points.length !== initialLength) {
				route.updated = true;
			}
		}
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
		const measureIndex = this.measure.points.map((p: PointDescription) => p.id).indexOf(id);
		if (measureIndex !== -1) {
			if (this.measure.choosing > this.measure.points.length - 2) {
				this.measure.choosing = this.measure.points.length - 2
				if (this.measure.choosing < 0) this.measure.choosing = null;
			};
			this.measure.points.splice(measureIndex, 1);
		}
		delete this.temps[id];
		if (this.currentPointId && this.currentPointId === id) {
			this.setCurrentPoint(null);
		}
	},
	deleteAllTemps() {
		for (const id in this.temps) {
			this.deleteTemp(id);
		}
	},
	deleteAllMeasurePoints() {
		this.measure.points.forEach((p: PointDescription) => {
			if (!this.temps[p.id]) return;
			delete this.temps[p.id];
			if (this.currentPointId && this.currentPointId === p.id) {
				this.setCurrentPoint(null);
			}
		});
		this.measure.points.length = 0;
		this.measure.choosing = 0;
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
		Object.assign(entity, change);
		entity.updated = true;
		if (this.newEntityPointId === entity.id) this.newEntityPointId = null;
		this.saved = false;
		this.backupState();

		const coordsChanged =
			Object.hasOwn(change, 'latitude') ||
			Object.hasOwn(change, 'longitude')
		;
		const altitudeMissing =
			entity.altitude === null ||
			entity.altitude === undefined
		;
		if (coordsChanged || altitudeMissing) this.setPointAltitude(entity);
	},
	changePlace(
		{ entity, change }: { entity: Place; change: Partial<Place>; }
	) {
		if ('srt' in change) entity.srt = Number(change.srt) || 0;
		Object.assign(entity, change);
		entity.updated = true;
		this.saved = false;
		this.backupState();
	},
	changeRoute(
		{ entity, change }: { entity: Route; change: Partial<Route>; }
	) {
		if ('srt' in change) entity.srt = Number(change.srt) || 0;
		Object.assign(entity, change);
		entity.updated = true;
		this.saved = false;
		this.backupState();
	},
	changeRoutePoint(
		{ route, index, change }:
		{ route: Route; index: number; change: Partial<PointDescription>; }
	) {
		Object.assign(route.points[index], change);
		route.updated = true;
		this.saved = false;
		this.backupState();
	},
	changeFolder(
		{ folder, change }: { folder: Folder; change: Partial<Folder>; }
	) {
		Object.assign(folder, change);
		folder.updated = true;
		this.saved = false;
		this.backupState();
	},

// SEC Setting Current

	setCurrentPoint<T extends string | Point | null | undefined>(
		param: T,
		center?: boolean,
	) {
		let point: Point;
		if (typeof param === 'string') {
			point = this.getPointById(param) ?? null;
		} else {
			point = param ?? null;
		}
		this.currentPointId = point?.id;
		if (!point) return;
		if (point.altitude === null) this.setPointAltitude(point);
		let index: number;
		if (this.currentRouteId) {
			index = this.currentRoute.points.map((p: PointDescription) => p.id).indexOf(point.id);
			if (index !== -1) this.currentRoute.choosing = index;
		}
		index = this.measure.points.map((p: PointDescription) => p.id).indexOf(point.id);
		if (index !== -1) this.measure.choosing = index;
		if (center !== false && point) this.center = {
			latitude: point.latitude,
			longitude: point.longitude,
		};
	},
	setCurrentPlace<T extends string | Place | null | undefined>(
		param: T,
		center?: boolean,
	) {
		let place: Place | null;
		if (typeof param === 'string') {
			place = this.getPlaceById(param) ?? null;
		} else {
			place = param ?? null;
		}
		this.currentPlaceId = place?.id;
		if (place) this.setCurrentPoint(place.pointid, center);
	},
	setCurrentRoute<T extends string | Route | null | undefined>(
		param: T,
		center?: boolean,
	) {
		let route: Route | null;
		if (typeof param === 'string') {
			route = this.getRouteById(param) ?? null;
		} else {
			route = param ?? null;
		}
		this.currentRouteId = route?.id;
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
	async setHomePlace(
		{ id, silent = false }:
		{ id: string | null; silent?: boolean; }
	) {
		if (!this.user) return;
		this.user.homeplace = (id && this.places[id]) ? id  : null;
		if (!silent) {
			this.saved = false;
			this.backupState();
		}
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
};

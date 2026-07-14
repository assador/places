import {
	StoreMain,
	ActionsEntity,
	BaseUpsertParams,
	UpsertPointParams,
	UpsertPlaceParams,
} from '@/stores/types';
import {
	Mode,
	Folder,
	Point,
	Place,
	Route,
	Measure,
	PointDescription,
	PointInfo,
} from '@/types';

import { isPoint, isPlace, isRoute, isMeasure } from '@/guards';
import { useGeolocation } from '@/services/geolocation';
import { findInDictByMinMaxKey } from '@/shared/common';

// SEC Factories

function _defaultPoint(
	userId: string | null,
	coords: { latitude: number, longitude: number },
): Point {
	return {
		type: 'point',
		id: crypto.randomUUID(),
		userid: userId,
		latitude: coords.latitude,
		longitude: coords.longitude,
		altitude: null,
		time: new Date().toISOString().slice(0, -5),
		common: false,
		enabled: true,
		show: true,
		added: false,
		deleted: false,
		updated: false,
	};
};
function _defaultPlace(userId: string | null): Place {
	return {
		type: 'place',
		id: crypto.randomUUID(),
		userid: userId,
		folderid: null,
		name: '',
		description: '',
		pointid: '',
		link: '',
		time: new Date().toISOString().slice(0, -5),
		images: {},
		srt: 10,
		geomark: true,
		common: false,
		enabled: true,
		show: true,
		added: false,
		deleted: false,
		updated: false,
	};
};
function _defaultRoute(userId: string | null): Route {
	return {
		type: 'route',
		id: crypto.randomUUID(),
		userid: userId,
		folderid: null,
		points: [],
		choosing: null,
		name: '',
		description: '',
		link: '',
		time: new Date().toISOString().slice(0, -5),
		images: {},
		srt: 10,
		geomarks: 1,
		common: false,
		enabled: true,
		show: true,
		added: false,
		deleted: false,
		updated: false,
	};
};
function _defaultFolder(userId: string | null): Folder {
	return {
		type: 'folder',
		id: crypto.randomUUID(),
		userid: userId,
		parent: null,
		context: 'places',
		name: '',
		description: '',
		srt: 10,
		geomarks: 1,
		common: false,
		open: false,
		enabled: true,
		show: true,
		added: false,
		deleted: false,
		updated: false,
	};
};

// SEC Creating Entities

export function initPointFactory(
	getUserId: () => string | null,
	getCoords: () => { latitude: number, longitude: number },
) {
	return function createPoint(overrides?: Partial<Point>): Point {
		return {
			..._defaultPoint(getUserId(), getCoords()),
			...overrides,
		};
	};
}
export function initPlaceFactory(getUserId: () => string | null) {
	return function createPlace(overrides?: Partial<Place>): Place {
		return {
			..._defaultPlace(getUserId()),
			...overrides,
		};
	};
}
export function initRouteFactory(getUserId: () => string | null) {
	return function createRoute(overrides?: Partial<Route>): Route {
		return {
			..._defaultRoute(getUserId()),
			...overrides,
		};
	};
}
export function initFolderFactory(getUserId: () => string | null) {
	return function createFolder(overrides?: Partial<Folder>): Folder {
		return {
			..._defaultFolder(getUserId()),
			...overrides,
		};
	};
}

export function useActionsEntity(
	store: StoreMain,
): ActionsEntity {

	const createPoint = initPointFactory(
		() => store.user.value?.id ?? null,
		() => ({
			latitude: store.center.value.latitude,
			longitude: store.center.value.longitude
		}),
	);
	const createPlace = initPlaceFactory(() => store.user.value?.id ?? null);
	const createRoute = initRouteFactory(() => store.user.value?.id ?? null);
	const createFolder = initFolderFactory(() => store.user.value?.id ?? null);

// SEC Setting Current

	const setCurrentPoint = <T extends string | Point | null | undefined>(
		param: T,
		center?: boolean,
	): void => {
		let point: Point | null;
		if (typeof param === 'string') {
			point = store.getPointById(param) ?? null;
		} else {
			point = param ?? null;
		}
		store.currentPointId.value = point?.id ?? null;
		if (!point) return;
		if (point.altitude === null) store.setPointAltitude(point);
		let index: number;
		const currentRoute = store.currentRoute.value;
		if (currentRoute) {
			index = currentRoute.points.findIndex((p: PointDescription) => p.id);
			if (index !== -1) currentRoute.choosing = index;
		}
		index = store.measure.value.points.findIndex((p: PointDescription) => p.id);
		if (index !== -1) store.measure.value.choosing = index;
		if (center !== false && point) store.center.value = {
			latitude: point.latitude,
			longitude: point.longitude,
		};
	};
	const setCurrentPlace = <T extends string | Place | null | undefined>(
		param: T,
		center?: boolean,
	): void => {
		let place: Place | null;
		if (typeof param === 'string') {
			place = store.getPlaceById(param) ?? null;
		} else {
			place = param ?? null;
		}
		setCurrentPoint(place?.pointid ?? null, center);
		store.currentPlaceId.value = place?.id ?? null;
	};
	const setCurrentRoute = <T extends string | Route | null | undefined>(
		param: T,
		center?: boolean,
	): void => {
		let route: Route | null;
		if (typeof param === 'string') {
			route = store.getRouteById(param) ?? null;
		} else {
			route = param ?? null;
		}
		store.currentRouteId.value = route?.id ?? null;
		if (route?.points.length) {
			if (// Damn you all
				typeof route.choosing !== 'number' ||
				!Number.isInteger(route.choosing) ||
				route.choosing < 0 ||
				route.choosing > route.points.length - 1
			) {
				route.choosing = 0;
			}
			setCurrentPoint(route.points[route.choosing].id, center);
		}
	};
	const setFirstCurrentPlace = (): void => {
		if (store.homePlace.value) {
			setCurrentPlace(store.homePlace.value);
			return;
		}
		let anyPlace: Place | null = null;
		for (const id in store.places.value) {
			if (!Object.hasOwn(store.places.value, id)) continue;
			const place = store.places.value[id];
			if (!place.folderid) {
				setCurrentPlace(place);
				return;
			}
			if (!anyPlace) anyPlace = place;
		}
		setCurrentPlace(anyPlace);
	};
	const setFirstCurrentRoute = (): void => {
		let anyRoute: Route | null = null;
		for (const id in store.routes.value) {
			if (!Object.hasOwn(store.routes.value, id)) continue;
			const route = store.routes.value[id];
			if (!route.folderid) {
				setCurrentRoute(route);
				return;
			}
			if (!anyRoute) anyRoute = route;
		}
		setCurrentRoute(anyRoute);
	};
	const setHomePlace = (
		{ id, silent = false }:
		{ id: string | null; silent?: boolean; }
	): void => {
		if (!store.user.value) return;
		store.user.value.homeplace = (id && store.places.value[id]) ? id : null;
		if (!silent) {
			store.saved.value = false;
			store.backupState();
		}
	};

// SEC Upserting Entities

	const upsertPoint = (params: UpsertPointParams = {}): Point | null => {
		const {
			object,
			props = {},
			where = store.points.value,
			whom,
			name,
			description,
			mode = 'new',
			silent = false,
		} = params;

		if (!store.user.value || !store.serverConfig.value) return null;
		let point: Point | null = null;

		if (
			store.tempsShow.value.first &&
			store.mode.value === 'normal' &&
			where === store.temps.value
		) {
			store.tempsShow.value.show = true;
			store.tempsShow.value.first = false;
		}
		if (mode === 'new' || mode === 'clone') {
			// Check points limit
			if (
				!store.user.value.testaccount &&
				store.serverConfig.value.rights.pointscount > 0 &&
				Object.keys(where).length >= store.serverConfig.value.rights.pointscount
			) {
				store.setMessage(store.t.value.m.popup.pointsCountExceeded, 3);
				return null;
			}
		}

		switch (mode) {
			case 'move':
				if (!object) return null;
				Object.assign(object, { updated: true }, props);
				point = object;
				break;
			case 'change':
				if (!object) return null;
				Object.assign(object, { updated: true, deleted: false }, props);
				point = object;
				break;
			case 'new':
				point = createPoint({ added: true, ...props });
				where[point.id] = point;
				if (whom) {
					if (isPlace(whom)) {
						whom.pointid = point.id;
					} else {
						whom.points.push({
							id: point.id,
							name: name || `${whom.points.length + 1}`,
							description: description ||
							`${store.t.value.i.captions.routePoint} № ${whom.points.length + 1}`,
						});
					}
					if (!isMeasure(whom)) whom.updated = true;
				}
				store.newEntityPointId.value = point.id;
				break;
			case 'clone':
				if (!object) return null;
				point = createPoint({
					...object,
					...props,
					id: crypto.randomUUID(),
					added: true,
				});
				where[point.id] = point;
				if (whom) {
					if (isPlace(whom)) {
						whom.pointid = point.id;
					} else {
						const pn = whom.points.find(p => p.id === object.id);
						if (pn) pn.id = point.id;
					}
					if (!isMeasure(whom)) whom.updated = true;
				}
				store.newEntityPointId.value = point.id;
				break;
		}
		if (point.altitude === null) store.setPointAltitude(point);
		if (!silent) {
			store.saved.value = false;
			store.backupState();
		}
		return point;
	};
	const upsertPlace = (params: UpsertPlaceParams = {}): Place | null => {
		const {
			object,
			props,
			where = store.places.value,
			mode = 'new',
			center = false,
			silent = false,
		} = params;

		if (!store.user.value || !store.serverConfig.value) return null;
		let place: Place | null = null;
		let point: Point | null;
		const folderId = props?.folderid || object?.folderid || null;

		let srt = findInDictByMinMaxKey(where, 'srt', p => p.folderid === folderId).max?.val;
		if (typeof srt !== 'number') srt = 10; else srt += 10;

		if (mode === 'new' || mode === 'clone') {
			// Check places limit
			if (
				!store.user.value.testaccount &&
				store.serverConfig.value.rights.placescount > 0 &&
				Object.keys(where).length >= store.serverConfig.value.rights.placescount
			) {
				store.setMessage(store.t.value.m.popup.placesCountExceeded, 3);
				return null;
			}
		}
		const { latitude, longitude, altitude, ...placeProps } = props || {};

		switch (mode) {
			case 'move':
				if (!object) return null;
				Object.assign(object, { updated: true }, placeProps);
				place = object;
				break;
			case 'change':
				if (!object) return null;
				Object.assign(object, { updated: true, deleted: false }, placeProps);
				if (object.pointid && store.points.value[object.pointid]) {
					const pointToChange = store.points.value[object.pointid];
					const pointChanges: Partial<Point> = { updated: true };
					if (latitude !== undefined) pointChanges.latitude = latitude;
					if (longitude !== undefined) pointChanges.longitude = longitude;
					if (altitude !== undefined) pointChanges.altitude = altitude;
					Object.assign(pointToChange, pointChanges);
				}
				place = object;
				break;
			case 'new':
				point = placeProps?.pointid ? store.points.value[placeProps.pointid] : null;
				if (!point) {
					point = createPoint({
						added: true,
						latitude: latitude ?? 0,
						longitude: longitude ?? 0,
						altitude: altitude ?? null,
					});
					store.points.value[point.id] = point;
				}
				place = createPlace({
					...placeProps,
					pointid: point.id,
					folderid: folderId,
					srt: srt,
					added: true,
				});
				where[place.id] = place;
				break;
			case 'clone': {
				if (!object) return null;
				let pointId = object.pointid;
				if (latitude !== undefined || longitude !== undefined || altitude !== undefined) {
					const pointOriginal = pointId ? store.points.value[pointId] : null;
					const pointNew = createPoint({
						latitude: latitude ?? pointOriginal?.latitude ?? 0,
						longitude: longitude ?? pointOriginal?.longitude ?? 0,
						altitude: altitude !== undefined ? altitude : (pointOriginal?.altitude ?? null),
						added: true,
					});
					store.points.value[pointNew.id] = pointNew;
					pointId = pointNew.id;
				} else if (!pointId || !store.points.value[pointId]) {
					const pointNew = createPoint({ added: true });
					store.points.value[pointNew.id] = pointNew;
					pointId = pointNew.id;
				}
				place = createPlace({
					...object,
					...placeProps,
					id: crypto.randomUUID(),
					pointid: pointId,
					srt: srt,
					added: true,
				});
				where[place.id] = place;
				break;
			}
		}
		setCurrentPlace(place, center);
		if (!silent) {
			store.saved.value = false;
			store.backupState();
		}
		return place;
	};
	const upsertPlaceFollowing = (
		entity: Place | null | undefined,
		params: UpsertPlaceParams = {},
	): Place | null => {
		if (!entity) {
			return upsertPlace({ ...params, props: { ...params.props } });
		}
		const srts = store.getSrts(entity.id, 'place');
		const callParams: UpsertPlaceParams = {
			...params,
			props: {
				...params.props,
				folderid: entity.folderid,
				srt: srts ? srts.after : 10,
			}
		};
		return upsertPlace(callParams);
	};
	const upsertPlaceFromPointInfo = (info: PointInfo | null): Place | null => {
		if (!info || !info.point) return null;
		const pointId = info.point.id;
		if (Object.hasOwn(store.temps.value, pointId)) {
			store.points.value[pointId] = { ...info.point,	added: true };
			delete store.temps.value[pointId];
		}
		const upsertParams: UpsertPlaceParams = {
			mode: 'new',
			props: {
				pointid: pointId,
				name: info.name || '',
				description: info.description || '',
			},
		};
		return upsertPlaceFollowing(store.currentPlace.value, upsertParams);
	};
	const upsertRoute = (params: BaseUpsertParams<Route> = {}): Route | null => {
		const {
			object,
			props,
			where = store.routes.value,
			mode = 'new',
			silent = false,
		} = params;

		if (!store.user.value || !store.serverConfig.value) return null;
		let route: Route | null = null;
		const folderId = props?.folderid || object?.folderid || null;

		let srt = findInDictByMinMaxKey(where, 'srt', r => r.folderid === folderId).max?.val;
		if (typeof srt !== 'number') srt = 10; else srt += 10;

		if (mode === 'new' || mode === 'clone') {
			// Check routes limit
			if (
				!store.user.value.testaccount &&
				store.serverConfig.value.rights.routescount > 0 &&
				Object.keys(where).length >= store.serverConfig.value.rights.routescount
			) {
				store.setMessage(store.t.value.m.popup.routesCountExceeded, 3);
				return null;
			}
		}

		switch (mode) {
			case 'move':
				if (!object) return null;
				Object.assign(object, { updated: true }, props);
				route = object;
				break;
			case 'change':
				if (!object) return null;
				Object.assign(object, { updated: true, deleted: false }, props);
				route = object;
				break;
			case 'new':
				route = createRoute({
					...props,
					folderid: folderId,
					srt: srt,
					added: true,
				});
				where[route.id] = route;
				break;
			case 'clone':
				if (!object) return null;
				route = createRoute({
					...object,
					...props,
					id: crypto.randomUUID(),
					srt: srt,
					added: true,
				});
				where[route.id] = route;
				break;
		}
		store.setCurrentRoute(route);
		if (!silent) {
			store.saved.value = false;
			store.backupState();
		}
		return route;
	};
	const upsertRouteFollowing = (
		entity: Route | null | undefined,
		params: BaseUpsertParams<Route> = {},
	): Route | null => {
		if (!entity) {
			return upsertRoute({ ...params, props: { ...params.props } });
		}
		const srts = store.getSrts(entity.id, 'route');
		const callParams: BaseUpsertParams<Route> = {
			...params,
			props: {
				...params.props,
				folderid: entity.folderid,
				srt: srts ? srts.after : 10,
			}
		};
		return upsertRoute(callParams);
	};
	const upsertFolder = (params: BaseUpsertParams<Folder> = {}): Folder | null => {
		const {
			object,
			props,
			where = store.folders.value,
			mode = 'new',
			silent = false,
		} = params;

		if (!store.user.value || !store.serverConfig.value) return null;
		let folder: Folder | null = null;
		const parentId = props?.parent || object?.parent || null;

		let srt = findInDictByMinMaxKey(where, 'srt', f => f.parent === parentId).max?.val;
		if (typeof srt !== 'number') srt = 10; else srt += 10;

		if (mode === 'new') {
			// Check folders limit
			if (
				!store.user.value.testaccount &&
				store.serverConfig.value.rights.folderscount > 0 &&
				Object.keys(where).length >= store.serverConfig.value.rights.folderscount
			) {
				store.setMessage(store.t.value.m.popup.foldersCountExceeded, 3);
				return null;
			}
		}

		switch (mode) {
			case 'move':
				if (!object) return null;
				Object.assign(object, { updated: true }, props);
				folder = object;
				break;
			case 'change':
				if (!object) return null;
				Object.assign(object, { updated: true, deleted: false }, props);
				folder = object;
				break;
			case 'new':
				folder = createFolder({
					...props,
					parent: parentId,
					srt: srt,
					added: true,
				});
				if (folder.id) where[folder.id] = folder;
				break;
		}
		if (!silent) {
			store.saved.value = false;
			store.backupState();
		}
		return folder;
	};
	const upsertEntityWithCurrentLocation = async (mode: Mode): Promise<
		{ id: string | null, of: Place | Route | Measure | null } | null
	> => {
		try {
			const geoLocation = useGeolocation();
			const location = await geoLocation.getLocation();
			const props = {
				latitude: location.latitude,
				longitude: location.longitude,
			};
			let id: string | null = null;
			let of: Place | Route | Measure | null = null;
			if (mode === 'normal') {
				if (store.currentPlace.value) {
					of = upsertPlaceFollowing(store.currentPlace.value, { props });
				} else {
					of = upsertPlace({ props });
				}
				id = of ? (of as Place).pointid : null;
			} else if (mode === 'routes' && store.currentRoute.value) {
				of = store.currentRoute.value;
				const p = upsertPoint({
					where: store.points.value,
					whom: store.currentRoute.value,
					props,
				});
				id = p ? p.id : null;
			} else if (mode === 'measure') {
				of = store.measure.value;
				const p = upsertPoint({
					where: store.temps.value,
					props,
				});
				if (p) {
					store.addPointToPoints({
						point: p,
						entity: store.measure.value,
					});
					id = p.id;
				}
			}
			geoLocation.centerTo(location);
			return { id: id, of: of };
		} catch (error: unknown) {
			console.error(error);
			store.setMessage(store.t.value.m.errors.other.other, 5);
			return null;
		}
	};

// SEC Deleting Entities

	const deleteEntities = (objects: Record<string, Point | Place | Route | Folder>): void => {
		const pointsToCheck = new Set<string>();
		for (const id of Object.keys(objects)) {
			const obj = objects[id];
			if (!Object.hasOwn(objects, id)) continue;
			if (isPlace(obj)) {
				if (obj.pointid) pointsToCheck.add(obj.pointid);
			} else if (isRoute(obj)) {
				for (const pd of obj.points) pointsToCheck.add(pd.id);
			} else if (isPoint(obj)) {
				pointsToCheck.add(obj.id);
			}
			obj.deleted = true;
		}
		const refs = store.pointReferences.value;
		pointsToCheck.forEach(pid => {
			if (!store.points.value[pid]) return;
			store.points.value[pid].deleted = (refs.get(pid)?.size || 0) === 0;
		});
		cleanupRoutesFromDeletedPoints();
		fixCurrentsAfterDelete();
		store.updateSavedStatus();
		store.backupState();
	};
	const cleanupRoutesFromDeletedPoints = (): void => {
		const deletedPointIds = new Set<string>();
		for (const id of Object.keys(store.points.value)) {
			if (store.points.value[id].deleted) {
				deletedPointIds.add(id);
			}
		}
		if (deletedPointIds.size === 0) return;
		for (const id of Object.keys(store.routes.value)) {
			const route = store.routes.value[id];
			if (route.deleted) continue;
			const initialLength = route.points.length;
			route.points = route.points.filter(
				(pd: PointDescription) => !deletedPointIds.has(pd.id)
			);
			if (route.points.length !== initialLength) {
				route.updated = true;
			}
		}
	};
	const fixCurrentsAfterDelete = (): void => {
		if (!store.currentPlace.value || store.currentPlace.value.deleted) {
			if (store.homePlace.value && !store.homePlace.value.deleted) {
				setCurrentPlace(store.homePlace.value.id);
			} else {
				setCurrentPlace(null);
			}
		}
		if (!store.currentRoute.value || store.currentRoute.value.deleted) {
			store.setCurrentRoute(null);
		}
		if (!store.currentPoint.value || store.currentPoint.value.deleted) {
			setCurrentPoint(null);
		}
	};
	const prepareFolderDelete = (
		folderId: string,
		mode: string,
	): Record<string, Place | Route | Folder> => {
		const toDelete: Record<string, Place | Route | Folder> = {};
		const rootFolder = store.folders.value[folderId];
		if (!rootFolder) return toDelete;

		const placesMap: Record<string, Place[]> = {};
		const routesMap: Record<string, Route[]> = {};
		const folderIdsMap: Record<string, string[]> = {};

		if (mode === 'delete') {
			for (const id in store.places.value) {
				if (!Object.hasOwn(store.places.value, id)) continue;
				const p = store.places.value[id];
				if (p.folderid) {
					if (!placesMap[p.folderid]) placesMap[p.folderid] = [];
					placesMap[p.folderid].push(p);
				}
			}
			for (const id in store.routes.value) {
				if (!Object.hasOwn(store.routes.value, id)) continue;
				const r = store.routes.value[id];
				if (r.folderid) {
					if (!routesMap[r.folderid]) routesMap[r.folderid] = [];
					routesMap[r.folderid].push(r);
				}
			}
			for (const id in store.folders.value) {
				if (!Object.hasOwn(store.folders.value, id)) continue;
				const f = store.folders.value[id];
				if (f.parent) {
					if (!folderIdsMap[f.parent]) folderIdsMap[f.parent] = [];
					folderIdsMap[f.parent].push(id);
				}
			}
		}
		const collectRecursive = (fId: string) => {
			const folder = store.folders.value[fId];
			if (!folder) return;
			toDelete[fId] = folder;

			const childPlaces = placesMap[fId] || [];
			const childRoutes = routesMap[fId] || [];
			const childFolderIds = folderIdsMap[fId] || [];

			for (const p of childPlaces) toDelete[p.id] = p;
			for (const r of childRoutes) toDelete[r.id] = r;
			for (const id of childFolderIds) collectRecursive(id);
		};

		if (mode === 'delete') {
			collectRecursive(folderId);
		} else {
			if (rootFolder.parent !== null) toDelete[folderId] = rootFolder;
			for (const id in store.places.value) {
				if (!Object.hasOwn(store.places.value, id)) continue;
				const o = store.places.value[id];
				if (o.folderid === folderId) {
					o.folderid = null;
					o.updated = true;
				}
			}
			for (const id in store.routes.value) {
				if (!Object.hasOwn(store.routes.value, id)) continue;
				const o = store.routes.value[id];
				if (o.folderid === folderId) {
					o.folderid = null;
					o.updated = true;
				}
			}
			for (const id in store.folders.value) {
				if (!Object.hasOwn(store.folders.value, id)) continue;
				const o = store.folders.value[id];
				if (o.parent === folderId) {
					o.parent = null;
					o.updated = true;
				}
			}
		}
		return toDelete;
	};
	const deleteTemp = (id: string): void => {
		const measureIndex = store.measure.value.points.map((p: PointDescription) => p.id).indexOf(id);
		if (measureIndex !== -1 && store.measure.value.choosing !== null) {
			if (store.measure.value.choosing > store.measure.value.points.length - 2) {
				store.measure.value.choosing = store.measure.value.points.length - 2
				if (store.measure.value.choosing < 0) store.measure.value.choosing = null;
			};
			store.measure.value.points.splice(measureIndex, 1);
		}
		delete store.temps.value[id];
		if (store.currentPointId.value && store.currentPointId.value === id) {
			setCurrentPoint(null);
		}
	};
	const deleteAllTemps = (): void => {
		for (const id in store.temps.value) {
			if (Object.hasOwn(store.temps.value, id)) deleteTemp(id);
		}
	};
	const deleteAllMeasurePoints = (): void => {
		store.measure.value.points.forEach((p: PointDescription) => {
			if (!store.temps.value[p.id]) return;
			delete store.temps.value[p.id];
			if (store.currentPointId.value && store.currentPointId.value === p.id) {
				setCurrentPoint(null);
			}
		});
		store.measure.value.points = [];
		store.measure.value.choosing = 0;
	};
	const deleteImages = (
		{ imageIds, entity }:
		{ imageIds: string[]; entity: Place | Route; }
	): void => {
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
			store.saved.value = false;
			store.backupState();
		}
	};

// SEC Changing Entities

	const changePoint = (
		{ entity, change }: { entity: Point; change: Partial<Point>; }
	): void => {
		Object.assign(entity, change);
		entity.updated = true;
		if (store.newEntityPointId.value === entity.id) store.newEntityPointId.value = null;
		store.saved.value = false;
		store.backupState();

		const coordsChanged =
			Object.hasOwn(change, 'latitude') ||
			Object.hasOwn(change, 'longitude')
		;
		const altitudeMissing =
			entity.altitude === null ||
			entity.altitude === undefined
		;
		if (coordsChanged || altitudeMissing) store.setPointAltitude(entity);
	};
	const changePlace = (
		{ entity, change }: { entity: Place; change: Partial<Place>; }
	): void => {
		if (Object.hasOwn(change, 'srt')) entity.srt = Number(change.srt) || 0;
		Object.assign(entity, change);
		entity.updated = true;
		store.saved.value = false;
		store.backupState();
	};
	const changeRoute = (
		{ entity, change }: { entity: Route; change: Partial<Route>; }
	): void => {
		if (Object.hasOwn(change, 'srt')) entity.srt = Number(change.srt) || 0;
		Object.assign(entity, change);
		entity.updated = true;
		store.saved.value = false;
		store.backupState();
	};
	const changeRoutePoint = (
		{ route, index, change }:
		{ route: Route; index: number; change: Partial<PointDescription>; }
	): void => {
		Object.assign(route.points[index], change);
		route.updated = true;
		store.saved.value = false;
		store.backupState();
	};
	const changeFolder = (
		{ entity, change }: { entity: Folder; change: Partial<Folder>; }
	): void => {
		Object.assign(entity, change);
		entity.updated = true;
		store.saved.value = false;
		store.backupState();
	};

// SEC Inspections

	const inspectOrphanPlaces = (): void => {
		for (const id in store.places.value) {
			if (!Object.hasOwn(store.places.value, id)) continue;
			const p = store.places.value[id];
			if (p.folderid && !store.folders.value[p.folderid]) p.folderid = null;
		}
	};
	const inspectOrphanRoutes = (): void => {
		for (const id in store.routes.value) {
			if (!Object.hasOwn(store.routes.value, id)) continue;
			const r = store.routes.value[id];
			if (r.folderid && !store.folders.value[r.folderid]) r.folderid = null;
		}
	};
	const inspectOrphanFolders = (): void => {
		for (const id in store.folders.value) {
			if (!Object.hasOwn(store.folders.value, id)) continue;
			const f = store.folders.value[id];
			if (f.parent && !store.folders.value[f.parent]) f.parent = null;
		}
	};
	const resolveId = (
		oldId: string,
		idMap: Map<string, string>,
		entityRecord: Record<string, unknown>,
	): string => {
		const knownId = idMap.get(oldId);
		if (knownId) return knownId;
		if (entityRecord[oldId]) {
			idMap.set(oldId, oldId);
			return oldId;
		}
		const newId = crypto.randomUUID();
		idMap.set(oldId, newId);
		return newId;
	};

	return {
		setCurrentPoint,
		setCurrentPlace,
		setCurrentRoute,
		setFirstCurrentPlace,
		setFirstCurrentRoute,
		setHomePlace,
		upsertPoint,
		upsertPlace,
		upsertPlaceFollowing,
		upsertPlaceFromPointInfo,
		upsertRoute,
		upsertRouteFollowing,
		upsertFolder,
		upsertEntityWithCurrentLocation,
		deleteEntities,
		prepareFolderDelete,
		deleteTemp,
		deleteAllTemps,
		deleteAllMeasurePoints,
		deleteImages,
		changePoint,
		changePlace,
		changeRoute,
		changeFolder,
		changeRoutePoint,
		inspectOrphanPlaces,
		inspectOrphanRoutes,
		inspectOrphanFolders,
		resolveId,
	};
};

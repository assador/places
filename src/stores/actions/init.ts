import api from '@/api';
import { StoreMain, ActionsInit } from '@/stores/types';
import { isRecord, isUser, isFolder, isPoint, isPlace, isRoute } from '@/guards';

export function useActionsInit(
	store: StoreMain,
): ActionsInit {

	const toSafeString = (value: unknown): string | undefined => {
		if (value === undefined || value === null) return undefined;
		if (typeof value === 'string') return value;
		return String(value);
	};
	const reset = (): void => {
		store.$resetToDefault();
	};
	const unload = (): void => {
		store.refreshing.value = true;
		reset();
		localStorage.clear();
	};
	const entitiesReady = (
		entities: Record<string, Record<string, Record<string, unknown>>>,
		what?: string,
	): void => {
		const { folders, points, places, routes } = entities;

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
		for (const id in folders) {
			if (!Object.hasOwn(folders, id)) continue;
			const folder = folders[id];
			folder.type = 'folder';
			folder.added = added;
			folder.deleted = deleted;
			folder.updated = updated;
			folder.open = false;
			if (isFolder(folder)) store.folders.value[id] = folder;
		}
		for (const id in points) {
			if (!Object.hasOwn(points, id)) continue;
			const point = points[id];
			point.type = 'point';
			point.added = added;
			point.deleted = deleted;
			point.updated = updated;
			point.show = true;
			if (isPoint(point)) store.points.value[id] = point;
		}
		for (const id in places) {
			if (!Object.hasOwn(places, id)) continue;
			const place = places[id];
			place.type = 'place';
			place.added = added;
			place.deleted = deleted;
			place.updated = updated;
			place.show = true;
			place.common = Boolean(place.common);
			place.geomark = Boolean(place.geomark);
			if (isPlace(place)) store.places.value[id] = place;
		}
		for (const id in routes) {
			if (!Object.hasOwn(routes, id)) continue;
			const route = routes[id];
			route.type = 'route';
			route.added = added;
			route.deleted = deleted;
			route.updated = updated;
			route.show = true;
			route.common = Boolean(route.common);
			if (isRoute(route)) store.routes.value[id] = route;
		}
	};
	const setServerConfig = async (): Promise<void> => {
		try {
			const { data } = await api.get(
				'get_config.php?useruuid=' +
				localStorage.getItem('places-useruuid')
			);
			store.serverConfig.value = data;
		} catch (error) {
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetData);
			store.serverConfig.value = null;
		}
	};
	const setUsers = async (payload?: string): Promise<void> => {
		let ids: string[] | null = null;
		switch (payload) {
			case 'common':
				ids = [];
				for (const id in store.commonPlaces.value) {
					if (!Object.hasOwn(store.commonPlaces.value, id)) continue;
					const place = store.commonPlaces.value[id];
					if (place.userid && !ids.includes(place.userid)) ids.push(place.userid);
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
				store.users.value[data[idx].id] = {
					login: data[idx].login,
					name: data[idx].name,
				};
			}
		} catch (error) {
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetData);
			store.users.value = {};
		}
	};
	const setUser = async (): Promise<void> => {
		const sanitizeUserData = (raw: any): unknown => {
			if (!raw || typeof raw !== 'object') return raw;
			return {
				...raw,
				confirmed: raw.confirmed == 1 || raw.confirmed === true,
				testaccount: raw.testaccount == 1 || raw.testaccount === true,
			};
		};
		const uuid = localStorage.getItem('places-useruuid');
		if (!uuid) {
			store.user.value = null;
			return;
		}
		try {
			const { data } = await api.get('get_account.php?id=' + uuid);
			const user = sanitizeUserData(data);
			if (!isUser(user)) throw new Error(
				store.t.value.m.errors.server.invalidResponseUser + ': ' +
				JSON.stringify(data)
			);
			store.user.value = user;
		} catch (error) {
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetData);
			store.user.value = null;
		}
	};
	const setEntities = async (): Promise<void> => {
		const sanitizeEntitiesData = (raw: any): Record<string, Record<string, Record<string, unknown>>> => {
			if (!raw || typeof raw !== 'object') return raw;

			const cleanDict = (dict: Record<string, unknown> | undefined): Record<string, any> => {
				if (!dict || typeof dict !== 'object') return {};
				const result: Record<string, any> = {};

				for (const [key, item] of Object.entries(dict)) {
					if (item && isRecord(item)) {
						const entity = { ...item };
						if ('name' in entity) {
							entity.name = toSafeString(entity.name) ?? '';
						}
						if ('description' in entity) {
							entity.description = toSafeString(entity.description);
						}
						result[key] = entity;
					} else {
						result[key] = item;
					}
				}
				return result;
			};

			return {
				folders: cleanDict(raw.folders),
				points: cleanDict(raw.points),
				places: cleanDict(raw.places),
				routes: cleanDict(raw.routes),
				// TODO Implement Commons:
				// commonPlaces: cleanDict(raw.commonPlaces),
				// commonRoutes: cleanDict(raw.commonRoutes),
			};
		};
		const uuid = localStorage.getItem('places-useruuid');
		if (!uuid) return;

		try {
			const { data } = await api.get('get_entities.php?id=' + uuid);
			const cleanData = sanitizeEntitiesData(data);

			entitiesReady(cleanData);
			store.setHomePlace({
				id: store.user.value?.homeplace ? store.user.value.homeplace : null,
				silent: true,
			});
			store.setFirstCurrentRoute();
			store.setFirstCurrentPlace();
		} catch (error) {
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetDataFromDb);
			entitiesReady({
				folders: {},
				points: {},
				places: {},
				routes: {},
				commonPlaces: {},
				commonRoutes: {},
			});
		}
	};

	return {
		reset,
		unload,
		setServerConfig,
		setUsers,
		setUser,
		setEntities,
	};
};

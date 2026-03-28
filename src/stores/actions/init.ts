import {
	Point,
	Place,
	Route,
	Folder,
} from '@/types';
import {
	constants,
} from '@/shared';
import api from '@/api';

export const initActions = {
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
		this.messagesInterval = null;
		this.messagesTimeout = null;
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
	async setPlaces() {
		try {
			const { data } = await api.get(
				'get_entities.php?id=' +
				localStorage.getItem('places-useruuid')
			);
			this.placesReady({
				points: { ...data.points },
				places: { ...data.places },
				routes: { ...data.routes },
				folders: { ...data.folders },
				// TODO Implement Commons:
				// commonPlaces: { ...data.commonPlaces },
				// commonRoutes: { ...data.commonRoutes },
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
	},
};

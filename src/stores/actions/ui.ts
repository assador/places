import { StoreMain, ActionsUI } from '@/stores/types';
import { Place, Route, Folder, GeomarksState, Dictionary } from '@/types';
import { isFolder, isPlace, isRoute } from '@/guards';
import { constants } from '@/shared/constants';
import { distanceOnSphere } from '@/shared/common';

export function useActionsUI(
	store: StoreMain,
): ActionsUI {

	const setBusy = (busy: boolean = true): void => {
		if (busy) store.busyCount.value++;
			else store.busyCount.value = Math.max(0, store.busyCount.value - 1);
	};
	const changeLang = (lang: string): void => {
		store.lang.value = lang;
	};

// SEC Messages

	const clearMessagesTiming = (): void => {
		if (store.messagesInterval.value !== null) {
			clearInterval(store.messagesInterval.value);
			store.messagesInterval.value = null;
		}
		if (store.messagesTimeout.value !== null) {
			clearTimeout(store.messagesTimeout.value);
			store.messagesTimeout.value = null;
		}
	};
	const setMessage = (
		message: string,
		secondsForAll: number = 0,
		secondsForOne: number = 0.5,
	): void => {
		if (!message) return;
		const messageIndex = store.messages.value.indexOf(message);
		if (messageIndex === -1) store.messages.value.push(message);
		clearMessagesTiming();
		if (!store.messagesMouseOver.value && secondsForAll) {
			store.messagesTimeout.value = window.setTimeout(() => {
				if (store.messages.value.length === 1) {
					clearMessages();
					return;
				}
				store.messagesInterval.value = window.setInterval(() => {
					if (store.messages.value.length > 1) {
						deleteMessage(0);
					} else {
						clearMessages();
					}
				}, secondsForOne * 1000);
			}, secondsForAll * 1000);
		}
	};
	const deleteMessage = (index: number): void => {
		if (index >= 0 && store.messages.value[index]) store.messages.value.splice(index, 1);
	};
	const clearMessages = (polyubasu: boolean = false): void => {
		clearMessagesTiming();
		if (polyubasu || !store.messagesMouseOver.value) store.messages.value = [];
	};

// SEC Tree

	const folderOpenClose = (
		{ folder, open }:
		{ folder: Folder; open?: boolean; }
	): void => {
		const targetOpen = open !== undefined ? open : !folder.open;
		if (folder) {
			if (folder.virtual) store.trees.value[folder.context].open = targetOpen;
			else if (folder.id) store.folders.value[folder.id].open = targetOpen;
		}
	};
	const openTreeTo = (object: Place | Route): void => {
		if (!object) return;
		const context = object.type === 'place' ? 'places' : 'routes';
		folderOpenClose({
			folder: store.trees.value[context],
			open: true,
		});
		let id = object.folderid;
		while (id) {
			const folder = store.folders.value[id];
			if (!folder) break;
			folderOpenClose({ folder, open: true });
			id = folder.parent;
		}
	};
	const openTreeToCurrent = (current: Place | Route): void => {
		if (
			!current ||
			typeof current.userid !== 'string' ||
			typeof store.user.value?.id !== 'string' ||
			current.userid !== store.user.value.id
		) {
			return;
		}
		openTreeTo(current);
	};

// SEC Map

	const centerMarkerShowHide = (show?: boolean): void => {
		store.centerMarkerShow.value = show === undefined
			? !store.centerMarkerShow.value
			: show
		;
	};
	const markersShowHide = (show?: boolean): void => {
		store.markersShow.value = show === undefined
			? !store.markersShow.value
			: show
		;
	};
	const commonMarkersShowHide = (show?: boolean): void => {
		store.commonMarkersShow.value = show === undefined
			? !store.commonMarkersShow.value
			: show
		;
	};
	const commonRoutesShowHide = (show?: boolean): void => {
		store.commonRoutesShow.value = show === undefined
			? !store.commonRoutesShow.value
			: show
		;
	};
	const showHideGeomarks = (payload: {
		object: Folder | Place | Route;
		show: GeomarksState;
	}): void => {
		if (!store.user.value) return;

		const { object, show } = payload;
		const isShowAll = show === GeomarksState.All;
		const isShowNone = show === GeomarksState.None;

		if (isPlace(object)) {
			object.geomark = Boolean(show);
			object.updated = true;
		} else if (isRoute(object)) {
			object.geomarks = show;
			object.updated = true;
		} else if (isFolder(object)) {
			const { folders, places, routes } = store.collectRecursive(object.id, true);
			for (const id in folders) {
				if (!Object.hasOwn(folders, id)) continue;
				folders[id].geomarks = show;
				folders[id].updated = true;
			}
			for (const id in places) {
				if (!Object.hasOwn(places, id)) continue;
				places[id].geomark = Boolean(show);
				places[id].updated = true;
			}
			for (const id in routes) {
				if (!Object.hasOwn(routes, id)) continue;
				if (isShowNone || isShowAll) {
					routes[id].geomarks = show;
					routes[id].updated = true;
				}
			}
		}
		const showHideParentGeomarks = (
			parentId: string | null,
			context: 'places' | 'routes',
		) => {
			const parent = parentId
				? store.folders.value[parentId]
				: store.trees.value[context];
			if (!parent) return;

			let visibility: GeomarksState | null = null;
			let isPartial = false;
			const pIdStr = String(parentId);

			const siblingFolders = store.allChildrenMap.value[pIdStr] || {};
			for (const id in siblingFolders) {
				if (!Object.hasOwn(siblingFolders, id)) continue;
				const f = siblingFolders[id];
				if (f.context === context) {
					if (visibility === null) visibility = f.geomarks;
					else if (visibility !== f.geomarks) {
						isPartial = true;
						break;
					}
				}
			}
			if (!isPartial && context === 'places') {
				for (const id in store.places.value) {
					if (!Object.hasOwn(store.places.value, id)) continue;
					const p = store.places.value[id];
					if (p.folderid === parentId) {
						const current = p.geomark
							? GeomarksState.All
							: GeomarksState.None;
						if (visibility === null) visibility = current;
						else if (visibility !== current) {
							isPartial = true;
							break;
						}
					}
				}
			}
			if (!isPartial && context === 'routes') {
				for (const id in store.routes.value) {
					if (!Object.hasOwn(store.routes.value, id)) continue;
					const r = store.routes.value[id];
					if (r.folderid === parentId) {
						if (visibility === null) visibility = r.geomarks;
						else if (visibility !== r.geomarks) {
							isPartial = true;
							break;
						}
					}
				}
			}
			parent.geomarks = isPartial
				? GeomarksState.Partial
				: (visibility ?? GeomarksState.None);
			if ('updated' in parent) parent.updated = true;

			if (parentId !== null && 'parent' in parent) {
				showHideParentGeomarks(parent.parent, context);
			}
		};
		const startParentId = isFolder(object) ? object.parent : object.folderid;
		const context = isFolder(object)
			? object.context
			: isPlace(object)
				? 'places'
				: 'routes'
		;
		showHideParentGeomarks(startParentId, context);
		store.saved.value = false;
		store.backupState();
	};
	const showInRange = (range: number | null): void => {
		if (range === null || range <= 0) {
			for (const id in store.places.value) {
				if (!Object.hasOwn(store.places.value, id)) continue;
				store.places.value[id].show = true;
			}
		} else {
			const currentPointId = store.currentPlace.value?.pointid;
			if (!currentPointId) return;
			for (const id in store.places.value) {
				if (
					!Object.hasOwn(store.places.value, id) ||
					!store.places.value[id].pointid
				) {
					continue;
				}
				store.places.value[id].show = !(distanceOnSphere(
					store.points.value[store.places.value[id].pointid].latitude,
					store.points.value[store.places.value[id].pointid].longitude,
					store.points.value[currentPointId].latitude,
					store.points.value[currentPointId].longitude,
					constants.earthRadius,
				) > range);
			}
		}
	};
	const updateMap = (
		{ latitude, longitude, zoom }:
		{ latitude?: number; longitude?: number; zoom?: number; }
	): void => {
		if (typeof latitude === 'number') store.center.value.latitude = latitude;
		if (typeof longitude === 'number') store.center.value.longitude = longitude;
		if (typeof zoom === 'number') store.zoom.value = zoom;
	};

	return {
		setBusy,
		changeLang,
		clearMessagesTiming,
		setMessage,
		deleteMessage,
		clearMessages,
		folderOpenClose,
		openTreeTo,
		openTreeToCurrent,
		centerMarkerShowHide,
		markersShowHide,
		commonMarkersShowHide,
		commonRoutesShowHide,
		showHideGeomarks,
		showInRange,
		updateMap,
	};
};

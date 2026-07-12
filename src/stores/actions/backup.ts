import { StoreMain, StoreMainStateRefs, ActionsBackup } from '@/stores/types';
import { Point, Place, Route } from '@/types';
import { constants } from '@/shared/constants';
import { hasOwnStringKey } from '@/guards';

const BACKUP_IGNORE_KEYS = new Set<string>([
	'stateBackups',
	'stateBackupsIndex',
	'busyCount',
	'refreshing',
	'messages',
	'messagesInterval',
	'messagesTimeout',
	'idleTime',
	'currentDrag',
	't',
]);

export function useActionsBackup(
	store: StoreMain,
	state: StoreMainStateRefs,
): ActionsBackup {

	const backupState = (): void => {
		if (!state.backup.value || state.stateBackups.value.length >= constants.backupscount) return;

		state.stateBackups.value.splice(++state.stateBackupsIndex.value);
		const backupItem: Record<string, unknown> = {};

		for (const key of Object.keys(state) as (keyof StoreMainStateRefs)[]) {
			if (BACKUP_IGNORE_KEYS.has(key)) continue;
			backupItem[key] = state[key].value;
		}
		state.stateBackups.value.push(JSON.stringify(backupItem));
	};
	const restoreState = (backupIndex: number): void => {
		if (backupIndex < 0 || backupIndex > state.stateBackups.value.length - 1) return;
		if (state.stateBackupsIndex.value === backupIndex) return;

		const backupData = JSON.parse(state.stateBackups.value[backupIndex]);
		for (const key of Object.keys(backupData)) {
			if (hasOwnStringKey(state, key)) state[key].value = backupData[key];
		}
		state.stateBackupsIndex.value = backupIndex;
		state.saved.value = false;
		restoreObjectsAsLinks();
	};
	const replaceState = (payload: StoreMainStateRefs): void => {
		for (const key of Object.keys(payload) as (keyof StoreMainStateRefs)[]) {
			if (hasOwnStringKey(state, key)) state[key].value = payload[key].value;
		}
		store.changeLang(state.lang.value);
		restoreObjectsAsLinks();
	};
	const undo = (): void => {
		restoreState(state.stateBackupsIndex.value - 1);
	};
	const redo = (): void => {
		restoreState(state.stateBackupsIndex.value + 1);
	};
	const restoreObjectsAsLinks = (): void => {
		state.refreshing.value = true;
		state.backup.value = false;
		store.setHomePlace({
			id: (state.user.value?.homeplace ?? null),
			silent: true,
		});
		if (state.currentPlaceId.value) {
			let place: Place | null = null;
			if (state.commonPlaces.value[state.currentPlaceId.value])
				place = state.commonPlaces.value[state.currentPlaceId.value];
			if (state.places.value[state.currentPlaceId.value])
				place = state.places.value[state.currentPlaceId.value];
			store.setCurrentPlace(place, false);
		}
		if (state.currentRouteId.value) {
			let route: Route | null = null;
			if (state.routes.value[state.currentRouteId.value]) {
				route = state.routes.value[state.currentRouteId.value];
			}
			store.setCurrentRoute(route, false);
		}
		if (state.currentPointId.value) {
			let point: Point | null = null;
			if (state.points.value[state.currentPointId.value])
				point = state.points.value[state.currentPointId.value];
			if (state.temps.value[state.currentPointId.value])
				point = state.temps.value[state.currentPointId.value];
			store.setCurrentPoint(point, false);
		}
		state.backup.value = true;
		state.refreshing.value = false;
	};

	return {
		backupState,
		restoreState,
		replaceState,
		undo,
		redo,
		restoreObjectsAsLinks,
	};
};

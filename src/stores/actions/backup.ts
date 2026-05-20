import {
	Point,
	Place,
	Route,
	IMainState,
} from '@/types';
import { constants } from '@/shared/constants';

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
export const backupActions = {
	backupState() {
		if (!this.backup || this.stateBackups.length >= constants.backupscount) return;

		this.stateBackups.splice(++this.stateBackupsIndex);
		const backupItem: Record<string, any> = {};
		const stateKeys = Object.keys(this.$state);

		for (const key of stateKeys) {
			if (BACKUP_IGNORE_KEYS.has(key)) continue;
			backupItem[key] = this[key];
		}
		this.stateBackups.push(JSON.stringify(backupItem));
	},
	restoreState(backupIndex: number) {
		if (backupIndex < 0 || backupIndex > this.stateBackups.length - 1) return;
		if (this.stateBackupsIndex === backupIndex) return;

		const backupData = JSON.parse(this.stateBackups[backupIndex]);
		for (const key in backupData) {
			this[key] = backupData[key];
		}
		this.stateBackupsIndex = backupIndex;
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
			id: (this.user?.homeplace ?? null),
			silent: true,
		});
		if (this.currentPlaceId) {
			let place: Place = null;
			if (this.commonPlaces[this.currentPlaceId])
				place = this.commonPlaces[this.currentPlaceId];
			if (this.places[this.currentPlaceId])
				place = this.places[this.currentPlaceId];
			this.setCurrentPlace(place, false);
		}
		if (this.currentRouteId) {
			let route: Route = null;
			if (this.routes[this.currentRouteId]) {
				route = this.routes[this.currentRouteId];
			}
			this.setCurrentRoute(route, false);
		}
		if (this.currentPointId) {
			let point: Point = null;
			if (this.points[this.currentPointId])
				point = this.points[this.currentPointId];
			if (this.temps[this.currentPointId])
				point = this.temps[this.currentPointId];
			this.setCurrentPoint(point, false);
		}
		this.backup = true;
		this.refreshing = false;
	},
};

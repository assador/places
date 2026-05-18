import {
	Point,
	Place,
	Route,
	IMainState,
} from '@/types';
import { constants } from '@/shared/constants';

export const backupActions = {
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

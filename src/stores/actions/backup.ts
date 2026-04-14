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
};

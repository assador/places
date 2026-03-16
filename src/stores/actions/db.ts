import { EntityCollection } from '@/types';

export const dbActions = {
	savedToDB(payload: EntityCollection) {
		const collections = {
			points: this.points,
			places: this.places,
			routes: this.routes,
			folders: this.folders,
		};
		for (const [ key, stateDict ] of Object.entries(collections)) {
			const items = payload[key as keyof EntityCollection];
			if (!items) continue;
			items.forEach((item: any) => {
				if (item.deleted) {
					delete stateDict[item.id];
				} else {
					const stateItem = stateDict[item.id];
					if (stateItem) {
						stateItem.added = false;
						stateItem.updated = false;
						stateItem.deleted = false;
					}
				}
			});
		}
		this.updateSavedStatus();
		this.stateBackups = [];
		this.stateBackupsIndex = -1;
	},
	updateSavedStatus() {
		const pkg = this.getAllModifiedPackage;
		this.saved = (
			pkg.points.length === 0 &&
			pkg.places.length === 0 &&
			pkg.routes.length === 0 &&
			pkg.folders.length === 0
		);
	},
};

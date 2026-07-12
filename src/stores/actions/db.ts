import { StoreMain, ActionsDB } from '@/stores/types';
import { EntityCollection } from '@/types';
import { isDictKey } from '@/guards';

export function useActionsDB(
	store: StoreMain,
): ActionsDB {

	const savedToDB = (payload: EntityCollection): void => {
		for (const key of Object.keys(payload)) {
			if (!isDictKey(key) || !payload[key]) continue;
			for (const item of payload[key]) {
				if (!item.id) continue;
				if (item.deleted) {
					delete store[key].value[item.id];
				} else {
					const entity = store[key].value[item.id];
					if (entity) {
						if (entity.added) entity.added = false;
						if (entity.updated) entity.updated = false;
					}
				}
			}
		}
		updateSavedStatus();
	};
	const updateSavedStatus = (): void => {
		const pkg = store.getAllModifiedPackage.value;
		store.saved.value = (
			pkg.points?.length === 0 &&
			pkg.places?.length === 0 &&
			pkg.routes?.length === 0 &&
			pkg.folders?.length === 0
		);
	};

	return {
		savedToDB,
		updateSavedStatus,
	};
};

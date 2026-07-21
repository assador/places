import { StoreMain, ActionsDB } from '@/stores/types';
import { EntityCollection } from '@/types';
import { isDictKey } from '@/guards';
import { isEntityCollectionEmpty } from '@/services/common';
import { bufferInstance } from '@/services/localforage';

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
	const updateSavedStatus = async (): Promise<void> => {
		const isOffline = store.offlineMode.value || !store.online.value;
		store.saved.value = (
			isEntityCollectionEmpty(store.getAllModifiedPackage.value) && (
				isOffline || (
					isEntityCollectionEmpty(
						await bufferInstance.getItem<EntityCollection>('entities')
					) && !(
						await bufferInstance.getItem<EntityCollection>('home')
					)
				)
			)
		);
	};

	return {
		savedToDB,
		updateSavedStatus,
	};
};

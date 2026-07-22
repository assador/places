import { StoreMain, ActionsDB } from '@/stores/types';
import { EntityCollection } from '@/types';
import { isDictKey } from '@/guards';
import { buffer } from '@/services/buffer';
import { isEntityCollectionEmpty } from '@/services/common';

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
		if (!store.user.value || store.user.value.testaccount) return;
		const isOffline = store.offlineMode.value || !store.online.value;
		store.saved.value = (
			isEntityCollectionEmpty(store.getAllModifiedPackage.value) && (
				isOffline || (
					isEntityCollectionEmpty(
						(await buffer.getOf(store.user.value.id)).entities
					) && !(
						(await buffer.getOf(store.user.value.id)).home
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

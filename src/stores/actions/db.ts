import { StoreMain, ActionsDB } from '@/stores/types';
import { EntityCollection, BufferEntityCollectionKey } from '@/types';
import { SettingCollection, BufferSettingCollectionKey } from '@/types/settings';
import { isDictKey } from '@/guards';
import { buffer } from '@/services/buffer';
import { isEntityCollectionEmpty, isSettingCollectionEmpty } from '@/services/common';

export function useActionsDB(
	store: StoreMain,
): ActionsDB {

	const savedToDB = (
		context: 'entities' | 'settings',
		payload: EntityCollection & SettingCollection,
	): void => {
		for (const key of Object.keys(payload)) {
			if (!isDictKey(key) || !payload[key]) continue;
			for (const item of payload[key]) {
				if (!item.id) continue;
				const dict = context === 'settings'
					? store.settings.value[key as BufferSettingCollectionKey]
					: store[key as BufferEntityCollectionKey].value
				;
				if (item.deleted) {
					delete dict[item.id];
				} else {
					const entity = dict[item.id];
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
		const buffered = await buffer.getOf(store.user.value.id);
		store.saved.value = (
			isEntityCollectionEmpty(store.getAllModifiedPackage.value) && (
				isOffline || (
					!buffered.home &&
					isEntityCollectionEmpty(buffered.entities)
				)
			)
		);
		store.savedSettings.value = (
			isSettingCollectionEmpty(store.getAllModifiedSettings.value) && (
				isOffline || isSettingCollectionEmpty(buffered.settings)
			)
		);
	};

	return {
		savedToDB,
		updateSavedStatus,
	};
};

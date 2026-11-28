import { StoreMain, StoreAdmin, ActionsDB, ActionsDBAdmin } from '@/stores/types';
import {
	BufferEntityCollectionKey,
	EntityCollection,
	Group,
	User,
} from '@/types';
import {
	SettingCollection,
	BufferSettingCollectionKey,
} from '@/types/settings';
import { isDictKey, isGroup, isRecord,  isUser } from '@/guards';
import {
	isEntityCollectionEmpty,
	isGroupsCollectionEmpty,
	isSettingCollectionEmpty,
	isUsersCollectionEmpty,
} from '@/services/common';
import { buffer } from '@/services/buffer';

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
				if (typeof item.id !== 'string' || item.id === null) continue;
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

export function useActionsDBAdmin(
	store: StoreAdmin,
): ActionsDBAdmin {

	const savedToDB = (
		context: 'users' | 'groups' | 'settings',
		payload: Partial<User>[] | Partial<Group>[] | SettingCollection,
	): void => {
		switch (context) {
			case 'users':
				if (!Array.isArray(payload)) return;
				for (const item of payload) {
					if (!isUser(item)) continue;
					if (item.deleted) {
						delete store.users.value[item.id];
					} else {
						const entity = store.users.value[item.id];
						if (entity) {
							if (entity.added) entity.added = false;
							if (entity.updated) entity.updated = false;
						}
					}
				}
				break;
			case 'groups':
				if (!Array.isArray(payload)) return;
				for (const item of payload) {
					if (!isGroup(item)) continue;
					if (item.deleted) {
						delete store.groups.value[item.id];
					} else {
						const entity = store.groups.value[item.id];
						if (entity) {
							if (entity.added) entity.added = false;
							if (entity.updated) entity.updated = false;
						}
					}
				}
				break;
			case 'settings': {
				if (!isRecord(payload)) return;
				const dicts = {
					enums: store.settings.value.enums,
					groups: store.settings.value.groups,
					options: store.settings.value.options,
					usersvoc: store.settings.value.usersvoc,
				};
				for (const key of Object.keys(payload)) {
					if (!Array.isArray(payload[key])) continue;
					const dict = dicts[key as keyof typeof dicts];
					if (!dict) continue;
					for (const item of payload[key]) {
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
				break;
			}
		}
		updateSavedStatus();
	};
	const updateSavedStatus = (): void => {
		store.savedGroups.value =
			isGroupsCollectionEmpty(store.getAllModifiedGroups.value)
		;
		store.savedSettings.value =
			isSettingCollectionEmpty(store.getAllModifiedSettings.value)
		;
		store.savedUsers.value =
			isUsersCollectionEmpty(store.getAllModifiedUsers.value)
		;
	};

	return {
		savedToDB,
		updateSavedStatus,
	};
};

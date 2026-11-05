import { ref } from 'vue';
import { defineStore } from 'pinia';
import { StoreAdmin } from './types';
import { User, Group } from '@/types';
import { SettingsAdmin } from '@/types/settings';

import { useGettersAdmin } from './getters/admin';
import { useGettersSettingsAdmin } from './getters/settings';

import { useActionsAdmin } from './actions/admin';
import { useActionsSettingsAdmin } from './actions/settings';

export const useAdminStore = defineStore('admin', () => {

	const store = {
		settings: ref<SettingsAdmin>({
			groups: {},
			usersvoc: {},
		}),
		users: ref<Record<string, User>>({}),
		groups: ref<Record<string, Group>>({}),
		settingsSortBy: ref<string>('id'),
		usersSortBy: ref<string>('login'),
		groupsSortBy: ref<string>('id'),
	} as StoreAdmin;

	// const state = shallowReactive({ ...store });

	const gettersAdmin = useGettersAdmin(store);
	const gettersSettingsAdmin = useGettersSettingsAdmin(store);

	const getters = {
		...gettersAdmin,
		...gettersSettingsAdmin,
	};
	Object.assign(store, getters);

	const actionsAdmin = useActionsAdmin(store);
	const actionsSettingsAdmin = useActionsSettingsAdmin(store);

	const actions = {
		...actionsAdmin,
		...actionsSettingsAdmin,
	};
	Object.assign(store, actions);

	return store;
});

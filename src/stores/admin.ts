import { ref } from 'vue';
import { defineStore } from 'pinia';
import { StoreAdmin } from './types';
import { User, Group, Tree } from '@/types';
import { SettingsAdmin } from '@/types/settings';

import { useGettersAdmin } from './getters/admin';
import { useGettersSettingsAdmin } from './getters/settings';
import { useGettersTree } from './getters/tree';

import { useActionsAdmin } from './actions/admin';
import { useActionsEntityAdmin } from './actions/entity';
import { useActionsSettingsAdmin } from './actions/settings';
import { useActionsUIAdmin } from './actions/ui';

export const useAdminStore = defineStore('admin', () => {

	const settings = ref<SettingsAdmin>({
		groups: {},
		usersvoc: {},
	});
	const treeParams = ref<Record<string, Tree>>({
		settingsvoc: {
			context: 'settingsvoc',
			open: true,
			get folders() { return settings.value.groups; },
			get entities() { return settings.value.usersvoc; },
		},
	});
	const store = {
		settings,
		treeParams,
		users: ref<Record<string, User>>({}),
		groups: ref<Record<string, Group>>({}),
		usersSortBy: ref<string>('login'),
		groupsSortBy: ref<string>('id'),
		settingsSortBy: ref<string>('id'),
	} as StoreAdmin;

	// const state = shallowReactive({ ...store });

	const gettersAdmin         = useGettersAdmin(store);
	const gettersSettingsAdmin = useGettersSettingsAdmin(store);
	const gettersTree          = useGettersTree(store);

	const getters = {
		...gettersAdmin,
		...gettersSettingsAdmin,
		...gettersTree,
	};
	Object.assign(store, getters);

	const actionsAdmin         = useActionsAdmin(store);
	const actionsEntityAdmin   = useActionsEntityAdmin();
	const actionsSettingsAdmin = useActionsSettingsAdmin(store);
	const actionsUIAdmin       = useActionsUIAdmin(store);

	const actions = {
		...actionsAdmin,
		...actionsEntityAdmin,
		...actionsSettingsAdmin,
		...actionsUIAdmin,
	};
	Object.assign(store, actions);

	return store;
});

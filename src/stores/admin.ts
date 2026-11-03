import { ref } from 'vue';
import { defineStore } from 'pinia';
import { StoreAdmin } from './types';
import { User, Group } from '@/types';
import { useGettersAdmin } from './getters/admin';
import { useActionsAdmin } from './actions/admin';

export const useAdminStore = defineStore('admin', () => {

	const store = {
		users: ref<Record<string, User>>({}),
		groups: ref<Record<string, Group>>({}),
		usersSortBy: ref<string>('login'),
		groupsSortBy: ref<string>('id'),
	} as StoreAdmin;

	// const state = shallowReactive({ ...store });

	const gettersAdmin = useGettersAdmin(store);

	const getters = {
		...gettersAdmin,
	};
	Object.assign(store, getters);

	const actionsAdmin = useActionsAdmin(store);

	const actions = {
		...actionsAdmin,
	};
	Object.assign(store, actions);

	return store;
});

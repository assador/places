/* eslint-disable */
import { defineStore } from 'pinia';
import { useMainStore, IMainState } from './main';
import { useAdminStore, IAdminState } from './admin';
import { makeFieldsValidatable } from '@/shared/fields_validate';

interface State {
};
export const mainStore = useMainStore();
export const store = defineStore('store', {
	state: (): State => ({
		...mainStore.$state,
//		...adminStore.state,
	})
});

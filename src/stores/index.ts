/* eslint-disable */
import { defineStore } from 'pinia';
import { useMainStore, IMainState } from './main';
import { useAdminStore, IAdminState } from './admin';
import { makeFieldsValidatable } from '@/shared/fields_validate';

interface State {
};
/*
export const key: InjectionKey<StoreOptions<State>> = Symbol();

const tracking = (store) => {
	const trackingMutations: string[] = [
		'main/addPlaceMut',
		'main/addFolderMut',
		'main/changeWaypointMut',
		'main/changePlaceMut',
		'main/changeFolderMut',
		'main/deleteFolder',
		'main/deletePlace',
		'main/modifyFolders',
		'main/modifyPlaces',
		'main/swapImagesMut',
		'main/setHomePlaceMut',
		'main/setCurrentPlace',
		'main/setServerConfigMut',
		'main/placesReady',
		'main/stateReady',
		'main/changeLangMut',
		'main/changeColorThemeMut',
	];
	store.subscribe((mutation: MutationPayload, state) => {
		if (!trackingMutations.includes(mutation.type)) return;
		if (!state.refreshing) {
			sessionStorage.setItem('places-store-state', JSON.stringify(state));
		}
		if (
			mutation.payload &&
			mutation.type !== 'main/setHomePlaceMut' &&
			mutation.type !== 'main/setCurrentPlace' &&
			mutation.type !== 'main/placesReady' &&
			mutation.type !== 'main/stateReady' &&
			mutation.type !== 'main/changeLangMut' &&
			mutation.type !== 'main/changeColorThemeMut' &&
			(
				mutation.payload.hasOwnProperty('backup') &&
				!!mutation.payload.backup ||
				!mutation.payload.hasOwnProperty('backup')
			) && !(
				mutation.payload.key && (
					mutation.payload.key === 'added' ||
					mutation.payload.key === 'deleted' ||
					mutation.payload.key === 'updated'
				)
			) && !(
				mutation.payload.change && (
					'added' in mutation.payload.change  ||
					'deleted' in mutation.payload.change  ||
					'updated' in mutation.payload.change
				)
			)
		) {
			mainStore.backupState();
		}
	});
	store.watch(
		state => state.main.t,
		() => makeFieldsValidatable(mainStore.t, true)
	);
};

export const plugins = [tracking];
*/
export const mainStore = useMainStore();
export const store = defineStore('store', {
	state: (): State => ({
		...mainStore.$state,
//		...adminStore.state,
	})
});
/*
export function useStore() {
	return baseUseStore(key);
};
*/

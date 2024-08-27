import { InjectionKey } from 'vue';
import {
	createStore,
	useStore as baseUseStore,
	StoreOptions,
	MutationPayload,
} from 'vuex';
import { main } from './modules/main';
import { admin } from './modules/admin';
import { makeFieldsValidatable } from '@/shared/fields_validate';

export interface State {};

export const key: InjectionKey<StoreOptions<State>> = Symbol();

const tracking = (store) => {
	const trackingMutations: string[] = [
		'main/addPlace',
		'main/addFolder',
		'main/changeWaypoint',
		'main/changePlace',
		'main/changeFolder',
		'main/deleteFolder',
		'main/deletePlace',
		'main/modifyFolders',
		'main/modifyPlaces',
		'main/swapImages',
		'main/setHomePlace',
		'main/setCurrentPlace',
		'main/setServerConfig',
		'main/placesReady',
		'main/stateReady',
		'main/changeLang',
		'main/changeColortheme',
	];
	store.subscribe((mutation: MutationPayload, state) => {
		if (!trackingMutations.includes(mutation.type)) return;
		if (!state.refreshing) {
			sessionStorage.setItem('places-store-state', JSON.stringify(state));
		}
		if (
			mutation.payload &&
			mutation.type !== 'main/setHomePlace' &&
			mutation.type !== 'main/setCurrentPlace' &&
			mutation.type !== 'main/placesReady' &&
			mutation.type !== 'main/stateReady' &&
			mutation.type !== 'main/changeLang' &&
			mutation.type !== 'main/changeColortheme' &&
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
			store.commit('main/backupState');
		}
	});
	store.watch(
		state => state.main.t,
		() => makeFieldsValidatable(store.state.main.t, true)
	);
};

export const plugins = [tracking];

export const store = createStore<State>({
	modules: {
		main,
		admin,
	},
	plugins: [tracking],
});

export function useStore() {
	return baseUseStore(key);
};

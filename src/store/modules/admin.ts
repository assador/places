import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';
import { State } from '../index';
import { User, Group } from '../types';

export interface IAdminState {
	users: User[],
	groups: Group[],
	usersSortBy: string,
	groupsSortBy: string,
}

const namespaced: boolean = true;

export const state: IAdminState = {
	users: [],
	groups: [],
	usersSortBy: 'login',
	groupsSortBy: 'id',
};

export const mutations: MutationTree<IAdminState> = {
	setUsers(state, payload) {
		state.users = payload;
	},
	setGroups(state, payload) {
		state.groups = payload;
	},
	setUsersSortBy(state, sortBy) {
		state.usersSortBy = sortBy;
	},
	setGroupsSortBy(state, sortBy) {
		state.groupsSortBy = sortBy;
	},
	sort(state, payload) {
		state[payload.what].sort((a, b) => {
			const stringA = a[payload.by] ? a[payload.by].toString().toUpperCase() : '';
			const stringB = b[payload.by] ? b[payload.by].toString().toUpperCase() : '';
			if (stringA < stringB) return -1;
			if (stringA > stringB) return 1;
			return 0;
		});
	},
};

export const actions: ActionTree<IAdminState, State> = {
	setUsers({commit}, payload: User[]) {
		for (const user of payload) {
			user.confirmed = user.confirmed ? true : false;
		}
		commit('setUsers', payload);
	},
	setGroups({commit}, payload: Group[]) {
		for (const group of payload) {
			group.haschildren = group.haschildren ? true : false;
			group.system = group.system ? true : false;
		}
		commit('setGroups', payload);
	},
	setUsersSortBy({commit}, sortBy: string) {
		commit('setUsersSortBy', sortBy);
	},
	setGroupsSortBy({commit}, sortBy: string) {
		commit('setGroupsSortBy', sortBy);
	},
	sort({commit}, payload: {what: string, by: string}) {
		commit('sort', payload);
	},
};

export const getters: GetterTree<IAdminState, State> = {
};

export const admin: Module<IAdminState, State> = {
	namespaced,
	state,
	getters,
	actions,
	mutations,
};

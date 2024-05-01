import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';
import { State } from '../index';
import { User, Group } from '../types';

export interface IAdminState {
	users: User[],
	groups: Group[],
}

const namespaced: boolean = true;

export const state: IAdminState = {
	users: [],
	groups: [],
};

export const mutations: MutationTree<IAdminState> = {
	setGroups(state, payload) {
		state.groups = payload;
	}
};

export const actions: ActionTree<IAdminState, State> = {
	setGroups({commit}, payload: Group[]) {
		commit('setGroups');
	}
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

import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';
import { State } from '../index';
import { User, Group } from '../types';

export interface IAdminState {
	users: User[],
}

const namespaced: boolean = true;

export const state: IAdminState = {
	users: [],
};

export const mutations: MutationTree<IAdminState> = {
};

export const actions: ActionTree<IAdminState, State> = {
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

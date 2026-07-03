import { defineStore } from 'pinia';
import { User, Group } from '@/types';

export interface IAdminState {
	users: User[],
	groups: Group[],
	usersSortBy: string,
	groupsSortBy: string,
}

export const useAdminStore = defineStore('admin', {
	state: (): IAdminState => ({
		users: [],
		groups: [],
		usersSortBy: 'login',
		groupsSortBy: 'id',
	}),
	actions: {
		setUsersSortByMut(sortBy: string) {
			this.usersSortBy = sortBy;
		},
		setGroupsSortByMut(sortBy: string) {
			this.groupsSortBy = sortBy;
		},
		sortMut(payload: { what: string, by: string }) {
			this[payload.what].sort((a: any, b: any) => {
				const stringA = a[payload.by] ? a[payload.by].toString().toUpperCase() : '';
				const stringB = b[payload.by] ? b[payload.by].toString().toUpperCase() : '';
				if (stringA < stringB) return -1;
				if (stringA > stringB) return 1;
				return 0;
			});
		},
		setUsers(payload: User[]) {
			for (const user of payload) {
				user.confirmed = !!user.confirmed;
				user.checked = false;
			}
			this.users = payload;
		},
		setGroups(payload: Group[]) {
			for (const group of payload) {
				group.haschildren = !!group.haschildren;
				group.system = !!group.system;
				group.checked = false;
			}
			this.groups = payload;
		},
		setUsersSortBy(sortBy: string) {
			this.setUsersSortByMut(sortBy);
		},
		setGroupsSortBy(sortBy: string) {
			this.setGroupsSortByMut(sortBy);
		},
		sort(payload: { what: string, by: string }) {
			this.sortMut(payload);
		},
	},
});

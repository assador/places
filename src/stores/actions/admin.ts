import api from '@/api';
import { User, Group } from '@/types';
import { isUser } from '@/guards';
import { StoreAdmin, ActionsAdmin, UserKey, GroupKey } from '@/stores/types';

export function useActionsAdmin(
	store: StoreAdmin,
): ActionsAdmin {

	const setUsers = async (ids?: string[]): Promise<void> => {
		const sanitizeUsersData = (raw: any): Record<string, User> => {
			if (!raw || typeof raw !== 'object' && Array.isArray(raw)) return {};
			const sntzd: Record<string, unknown> = {};
			const users: Record<string, User> = {};
			for (const id in raw) {
				if (!Object.hasOwn(raw, id)) continue;
				sntzd[id] = {
					...raw[id],
					checked: raw[id].checked == 1 || raw[id].checked === true,
					confirmed: raw[id].confirmed == 1 || raw[id].confirmed === true,
					testaccount: raw[id].testaccount == 1 || raw[id].testaccount === true,
					added: false,
					deleted: false,
					updated: false,
				};
				if (isUser(sntzd[id])) users[id] = sntzd[id];
			}
			return users;
		};
		try {
			const { data } = await api.post(`get_users.php`, {
				users: Array.isArray(ids) ? { users: ids } : null,
				userid: localStorage.getItem('places-useruuid'),
				sessionid: localStorage.getItem('places-session'),
			});
			store.users.value = sanitizeUsersData(data);
		} catch (error) {
			console.error(error);
			store.users.value = {};
		}
	};
	const setGroups = async (): Promise<void> => {
		const groups: Record<string, Group> = {};
		store.groups.value = groups;
	};
	function performSort<T>(arr: T[], key: keyof T): void {
		arr.slice().sort((a, b) => {
			const valA = a[key];
			const valB = b[key];
			if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
			const strA = String(valA ?? '');
			const strB = String(valB ?? '');
			return strA.localeCompare(strB, undefined, {
				numeric: true,
						sensitivity: 'base',
			});
		});
	}
	const sort = ({ what, by }:
		| { what: 'groups'; by: GroupKey; }
		| { what: 'users'; by: UserKey; }
	): void => {
		if (what === 'groups') {
			performSort(Object.values(store.groups.value) as Group[], by);
		} else if (what === 'users') {
			performSort(Object.values(store.users.value) as User[], by);
		}
	};

	return {
		setUsers,
		setGroups,
		sort,
	};
};

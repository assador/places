import api from '@/api';
import { User, Group } from '@/types';
import { isUser, isGroup } from '@/guards';
import { StoreAdmin, ActionsAdmin } from '@/stores/types';

// SEC Factories

function _defaultGroup(
	id: string,
	owner: string,
): Group {
	return {
		id: id,
		owner: owner,
		parent: null,
		system: false,
		haschildren: false,
		name: '',
		description: '',
		added: false,
		deleted: false,
		updated: false,
	};
}

// SEC Creating

export function initGroupFactory(
	getId: () => string,
	getOwner: () => string,
) {
	return function createGroup(overrides?: Partial<Group>): Group {
		return {
			..._defaultGroup(getId(), getOwner()),
			...overrides,
		};
	};
};

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
		const sanitizeGroupsData = (raw: any): Record<string, Group> => {
			if (!raw || typeof raw !== 'object' && Array.isArray(raw)) return {};
			const sntzd: Record<string, unknown> = {};
			const groups: Record<string, Group> = {};
			for (const id in raw) {
				if (!Object.hasOwn(raw, id)) continue;
				sntzd[id] = {
					...raw[id],
					system: raw[id].system == 1 || raw[id].system === true,
					haschildren: raw[id].haschildren == 1 || raw[id].haschildren === true,
					added: false,
					deleted: false,
					updated: false,
				};
				if (isGroup(sntzd[id])) groups[id] = sntzd[id];
			}
			return groups;
		};
		try {
			const { data } = await api.post('get_groups.php', {
				userid: localStorage.getItem('places-useruuid'),
				sessionid: localStorage.getItem('places-session'),
			});
			store.groups.value = sanitizeGroupsData(data);
		} catch (error) {
			console.error(error);
			store.groups.value = {};
		}
	};

	return {
		setUsers,
		setGroups,
	};
};

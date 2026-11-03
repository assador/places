import { User, Group } from '@/types';
import { StoreAdminStateRefs, UserKey, GroupKey } from '@/stores/types';

export function useGettersAdmin(
	state: StoreAdminStateRefs,
) {

	function sorted<T>(arr: T[], key: keyof T): T[] {
		return arr.slice().sort((a, b) => {
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
	const getSorted = ({ what, by }:
		| { what: 'groups'; by: GroupKey; }
		| { what: 'users'; by: UserKey; }
	): (Group | User)[] | undefined => {
		if (what === 'groups') {
			const arr: Group[] = Object.values(state.groups.value);
			return sorted(arr, by);
		} else if (what === 'users') {
			const arr: User[] = Object.values(state.users.value);
			return sorted(arr, by);
		}
		return undefined;
	};

	return {
		getSorted,
	};
}

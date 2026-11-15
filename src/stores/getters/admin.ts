import { User, Group } from '@/types';
import { SettingsVocRec } from '@/types/settings';
import {
	StoreAdminStateRefs,
	UserKey,
	GroupKey,
	SettingsVocRecKey,
} from '@/stores/types';

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
	const getSorted = ({ what, by, of }:
		| { what: 'groups'; by: GroupKey; of?: Record<string, Group>; }
		| { what: 'users'; by: UserKey; of?: Record<string, User>; }
		| { what: 'settings'; by: SettingsVocRecKey; of?: Record<string, SettingsVocRec>; }
	): (Group | User | SettingsVocRec)[] | undefined => {
		if (what === 'groups') {
			const arr: Group[] = Object.values(state.groups.value);
			return sorted(arr, by);
		} else if (what === 'users') {
			const arr: User[] = Object.values(state.users.value);
			return sorted(arr, by);
		} else if (what === 'settings') {
			const arr: SettingsVocRec[] = Object.values(of ? of : state.settings.value.usersvoc);
			return sorted(arr, by);
		}
		return undefined;
	};

	return {
		getSorted,
	};
}

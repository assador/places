import { computed } from 'vue';
import { Group, User } from '@/types';
import { SettingsVocRec, SettingsVocRecKey } from '@/types/settings';
import {
	StoreAdminStateRefs,
	UserKey,
	GroupKey,
} from '@/stores/types';
import { getArrayOfRecordsSortedByKey } from '@/shared/common';

function collectModified<T extends Group | User>(c: Record<string, T>): T[] {
	const modified: T[] = [];
	for (const id in c) {
		if (!Object.hasOwn(c, id)) continue;
		if (
			(c[id].added || c[id].updated || c[id].deleted) &&
			!(c[id].added && c[id].deleted)
		) {
			modified.push(c[id]);
		}
	}
	return modified;
};

export function useGettersAdmin(
	state: StoreAdminStateRefs,
) {

	const getAllModifiedGroups = computed((): Group[] => {
		return collectModified(state.groups.value);
	});
	const getAllModifiedUsers = computed((): User[] => {
		return collectModified(state.users.value);
	});
	const getSorted = ({ what, by, of }:
		| { what: 'groups'; by: GroupKey; of?: Record<string, Group>; }
		| { what: 'users'; by: UserKey; of?: Record<string, User>; }
		| { what: 'settings'; by: SettingsVocRecKey; of?: Record<string, SettingsVocRec>; }
	): (Group | User | SettingsVocRec)[] | undefined => {
		if (what === 'groups') {
			const arr: Group[] = Object.values(state.groups.value);
			return getArrayOfRecordsSortedByKey(arr, by);
		} else if (what === 'users') {
			const arr: User[] = Object.values(state.users.value);
			return getArrayOfRecordsSortedByKey(arr, by);
		} else if (what === 'settings') {
			const arr: SettingsVocRec[] = Object.values(of ? of : state.settings.value.usersvoc);
			return getArrayOfRecordsSortedByKey(arr, by);
		}
		return undefined;
	};

	return {
		getAllModifiedGroups,
		getAllModifiedUsers,
		getSorted,
	};
}

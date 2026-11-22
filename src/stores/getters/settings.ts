import { computed } from 'vue';
import { StoreMainStateRefs, StoreAdminStateRefs } from '@/stores/types';
import { Folder } from '@/types';
import {
	Setting,
	SettingCollection,
	SettingCollectionToBack,
	SettingsAdmin,
	SettingsMain,
	SettingsVocRec,
} from '@/types/settings';
import { isOptionalNullNumericString, isValidSettingsVocRec } from '@/guards';
import { VALIDATION_ERROR } from '@/shared/response';
import { useMainStore } from '@/stores/main';

function collectModifiedSettings<T extends Folder | Setting | SettingsVocRec>(c: Record<string, T>): T[] {
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

export function useGettersSettings(
	state: StoreMainStateRefs,
) {

	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			groups: collectModifiedSettings(state.settings.value.groups),
			user: collectModifiedSettings(state.settings.value.user),
		};
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsUser = computed((): Record<string, Setting> => {
		return state.settings.value.user;
	});
	const getSettings = computed((): SettingsMain => {
		return {
			groups: getSettingsGroups.value,
			user: getSettingsUser.value,
		};
	});

	return {
		getAllModifiedSettings,
		getSettingsGroups,
		getSettingsUser,
		getSettings,
	};
};

export function useGettersSettingsAdmin(
	state: StoreAdminStateRefs,
) {

	const getSettingsToBack = (settings: SettingCollection): SettingCollectionToBack => {
		const mainStore = useMainStore();
		return {
			groups: settings.groups?.map((group) => {
				if (!isOptionalNullNumericString(group.id)) {
					const error = new Error(
						mainStore.t.m.errors.other.incorrectValue + ' SettingsGroup.'
					);
					error.name = VALIDATION_ERROR;
					throw error;
				}
				if (!isOptionalNullNumericString(group.parent)) {
					const error = new Error(
						mainStore.t.m.errors.other.incorrectValue + ' SettingsGroup.'
					);
					error.name = VALIDATION_ERROR;
					throw error;
				}
				const name = group.name?.trim();
				const description = group.description?.trim();
				return {
					id: Number(group.id),
					parent: group.parent === null ? null : Number(group.parent),
					srt: Number(group.srt),
					...(name && { name }),
					...(description && { description }),
					added: group.added,
					deleted: group.deleted,
					updated: group.updated,
				};
			}),
			usersvoc: settings.usersvoc?.map((setting) => {
				if (!isValidSettingsVocRec(setting)) {
					const error = new Error(
						mainStore.t.m.errors.other.incorrectFields + ' SettingsVocRec.'
					);
					error.name = VALIDATION_ERROR;
					throw error;
				}
				const name = setting.name?.trim();
				const description = setting.description?.trim();
				return {
					id: Number(setting.id),
					groupid: setting.folderid === null ? null : Number(setting.folderid),
					type: setting.valtype,
					baseval: setting.baseval,
					srt: setting.srt,
					public: setting.public ?? false,
					...(name && { name }),
					...(description && { description }),
					...(setting.enum && { enum: setting.enum }),
					added: setting.added,
					deleted: setting.deleted,
					updated: setting.updated,
				};
			}),
		};
	};
	const isValidSettingsVoc = computed((): boolean => {
		const voc = state.settings.value.usersvoc;
		for (const id in voc) {
			if (!Object.hasOwn(voc, id)) continue;
			if (!isValidSettingsVocRec(voc[id])) return false;
		}
		return true;
	});
	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			groups: collectModifiedSettings(state.settings.value.groups),
			usersvoc: collectModifiedSettings(state.settings.value.usersvoc),
		};
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsUsersVoc = computed((): Record<string, SettingsVocRec> => {
		return state.settings.value.usersvoc;
	});
	const getSettings = computed((): SettingsAdmin => {
		return {
			groups: getSettingsGroups.value,
			usersvoc: getSettingsUsersVoc.value,
		};
	});

	return {
		getAllModifiedSettings,
		getSettings,
		getSettingsToBack,
		getSettingsUsersVoc,
		isValidSettingsVoc,
	};
};

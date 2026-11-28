import { computed } from 'vue';
import { StoreMainStateRefs, StoreAdminStateRefs } from '@/stores/types';
import { Dictionary, Folder } from '@/types';
import {
	Setting,
	SettingCollection,
	SettingCollectionToBack,
	SettingsAdmin,
	SettingsEnum,
	SettingsMain,
    SettingsOption,
	SettingsVocRec,
} from '@/types/settings';
import {
	isOptionalNullNumericString,
	isSetting,
	isValidSettingsEnum,
	isValidSettingsOption,
	isValidSettingsVocRec,
} from '@/guards';
import { VALIDATION_ERROR } from '@/shared/response';
import { getArrayOfRecordsSortedByKey } from '@/shared/common';
import { useMainStore } from '@/stores/main';

type DictionaryExtraKey = keyof Dictionary['s']['extra'];

function collectModifiedSettings<
	T extends Folder | Setting | SettingsEnum | SettingsOption | SettingsVocRec
>(c: Record<string, T>): T[] {
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

	const getSettingsToBack = (settings: SettingCollection): SettingCollectionToBack => {
		return {
			user: settings.user?.map((setting) => {
				if (!isSetting(setting)) {
					const error = new Error(
						state.t.value.m.errors.other.incorrectFields + ' Setting.'
					);
					error.name = VALIDATION_ERROR;
					throw error;
				}
				return {
					settingid: Number(setting.id),
					value: setting.val,
					added: setting.added,
					deleted: setting.deleted,
					updated: setting.updated,
				};
			}),
		};
	};
	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			user: collectModifiedSettings(state.settings.value.user),
		};
	});
	const getOptionLabel = ({ val, extra }: Partial<SettingsOption>): string | undefined => {
		if (!extra) return String(val);
		if (Object.hasOwn(state.t.value.s.extra, extra)) {
			return state.t.value.s.extra[extra as DictionaryExtraKey];
		}
		return extra;
	}
	const getOptionsForEnumId = (id: unknown): SettingsOption[] | undefined => {
		if (typeof id !== 'string') return undefined;
		const options = getArrayOfRecordsSortedByKey(
			Object.values(state.settings.value.options).filter(o => o.enumid === id),
			'srt',
		);
		return options.length ? options : undefined;
	};
	const getSettingValue = (id: string) => {
		return (
			Object.hasOwn(state.settings.value.user, id) &&
			!state.settings.value.user[id].deleted
				? state.settings.value.user[id].val
				: state.settings.value.usersvoc[id]?.baseval
		);
	};
	const getSettingsEnums = computed((): Record<string, SettingsEnum> => {
		return state.settings.value.enums;
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsOptions = computed((): Record<string, SettingsOption> => {
		return state.settings.value.options;
	});
	const getSettingsUser = computed((): Record<string, Setting> => {
		return state.settings.value.user;
	});
	const getSettingsUsersVoc = computed((): Record<string, SettingsVocRec> => {
		return state.settings.value.usersvoc;
	});
	const getSettings = computed((): SettingsMain => {
		return {
			enums: getSettingsEnums.value,
			groups: getSettingsGroups.value,
			options: getSettingsOptions.value,
			user: getSettingsUser.value,
			usersvoc: getSettingsUsersVoc.value,
		};
	});

	return {
		getAllModifiedSettings,
		getOptionLabel,
		getOptionsForEnumId,
		getSettingValue,
		getSettings,
		getSettingsEnums,
		getSettingsGroups,
		getSettingsOptions,
		getSettingsToBack,
		getSettingsUser,
		getSettingsUsersVoc,
	};
};

export function useGettersSettingsAdmin(
	state: StoreAdminStateRefs,
) {

	const getSettingsToBack = (settings: SettingCollection): SettingCollectionToBack => {
		const mainStore = useMainStore();
		return {
			groups: settings.groups?.map((group) => {
				if (
					!isOptionalNullNumericString(group.id) ||
					!isOptionalNullNumericString(group.parent)
				) {
					const error = new Error(
						mainStore.t.m.errors.other.incorrectValue + ' DBSettingsGroup.'
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
			enums: settings.enums?.map((enm) => {
				if (!isValidSettingsEnum(enm)) {
					const error = new Error(
						mainStore.t.m.errors.other.incorrectFields + ' SettingsEnum.'
					);
					error.name = VALIDATION_ERROR;
					throw error;
				}
				const name = enm.name?.trim();
				const description = enm.description?.trim();
				return {
					id: Number(enm.id),
					type: enm.valtype,
					srt: enm.srt,
					...(name && { name }),
					...(description && { description }),
					added: enm.added,
					deleted: enm.deleted,
					updated: enm.updated,
				};
			}),
			options: settings.options?.map((option) => {
				if (!isValidSettingsOption(option)) {
					const error = new Error(
						mainStore.t.m.errors.other.incorrectFields + ' SettingsOption.'
					);
					error.name = VALIDATION_ERROR;
					throw error;
				}
				const extra = option.extra != null ? option.extra : undefined;
				return {
					id: Number(option.id),
					enumid: Number(option.enumid),
					value: option.val,
					srt: option.srt,
					enabled: option.enabled ?? false,
					...(extra && { extra }),
					added: option.added,
					deleted: option.deleted,
					updated: option.updated,
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
				const enumid = setting.enumid != null ? Number(setting.enumid) : undefined;
				return {
					id: Number(setting.id),
					groupid: setting.folderid === null ? null : Number(setting.folderid),
					type: setting.valtype,
					baseval: setting.baseval,
					srt: setting.srt,
					public: setting.public ?? false,
					...(name && { name }),
					...(description && { description }),
					...(enumid && { enumid }),
					added: setting.added,
					deleted: setting.deleted,
					updated: setting.updated,
				};
			}),
		};
	};
	const getOptionsForEnumId = (id: unknown): SettingsOption[] | undefined => {
		if (typeof id !== 'string') return undefined;
		const options = getArrayOfRecordsSortedByKey(
			Object.values(state.settings.value.options).filter(o => o.enumid === id),
			'srt',
		);
		return options.length ? options : undefined;
	};
	const isValidSettingsEnums = computed((): boolean => {
		const enums = state.settings.value.enums;
		for (const id in enums) {
			if (!Object.hasOwn(enums, id)) continue;
			if (!isValidSettingsEnum(enums[id])) return false;
		}
		return true;
	});
	const isValidSettingsOptions = computed((): boolean => {
		const options = state.settings.value.options;
		for (const id in options) {
			if (!Object.hasOwn(options, id)) continue;
			if (!isValidSettingsOption(options[id])) return false;
		}
		return true;
	});
	const isValidSettingsVoc = computed((): boolean => {
		const voc = state.settings.value.usersvoc;
		for (const id in voc) {
			if (!Object.hasOwn(voc, id)) continue;
			if (!isValidSettingsVocRec(voc[id])) return false;
		}
		return true;
	});
	const getAllModifiedSettingsEnums = computed((): SettingCollection => {
		const enums = collectModifiedSettings(state.settings.value.enums);
		return {
			...(enums.length && { enums }),
		};
	});
	const getAllModifiedSettingsOptions = computed((): SettingCollection => {
		const options = collectModifiedSettings(state.settings.value.options);
		return {
			...(options.length && { options }),
		};
	});
	const getAllModifiedUsersSettingsVoc = computed((): SettingCollection => {
		const groups = collectModifiedSettings(state.settings.value.groups);
		const usersvoc = collectModifiedSettings(state.settings.value.usersvoc);
		return {
			...(groups.length && { groups }),
			...(usersvoc.length && { usersvoc }),
		};
	});
	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			...getAllModifiedSettingsEnums.value,
			...getAllModifiedSettingsOptions.value,
			...getAllModifiedUsersSettingsVoc.value,
		};
	});
	const getSettingsEnums = computed((): Record<string, SettingsEnum> => {
		return state.settings.value.enums;
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsOptions = computed((): Record<string, SettingsOption> => {
		return state.settings.value.options;
	});
	const getSettingsUsersVoc = computed((): Record<string, SettingsVocRec> => {
		return state.settings.value.usersvoc;
	});
	const getSettings = computed((): SettingsAdmin => {
		return {
			enums: getSettingsEnums.value,
			groups: getSettingsGroups.value,
			options: getSettingsOptions.value,
			usersvoc: getSettingsUsersVoc.value,
		};
	});

	return {
		getAllModifiedSettings,
		getAllModifiedSettingsEnums,
		getAllModifiedSettingsOptions,
		getAllModifiedUsersSettingsVoc,
		getOptionsForEnumId,
		getSettings,
		getSettingsEnums,
		getSettingsGroups,
		getSettingsOptions,
		getSettingsToBack,
		getSettingsUsersVoc,
		isValidSettingsEnums,
		isValidSettingsOptions,
		isValidSettingsVoc,
	};
};

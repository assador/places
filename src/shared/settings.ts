import { SettingsVocRec, SettingsVocRecKey } from '@/types/settings';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();

type SettingsVocRecField<K extends keyof SettingsVocRec> = {
	caption: string;
	sortBy?: SettingsVocRecKey;
	formatter?: (value: Exclude<SettingsVocRec[K], undefined>) => unknown;
	parser?: (value: string) => Exclude<SettingsVocRec[K], undefined>;
};

export type SettingsVocRecFields = {
	[K in keyof SettingsVocRec]?: SettingsVocRecField<K>;
};

export const settingsVocRecFields: SettingsVocRecFields = {
	id: {
		caption: mainStore.t.i.captions.id,
		parser: value => value,
	},
	name: {
		caption: mainStore.t.i.captions.name,
		parser: value => value,
	},
	description: {
		caption: mainStore.t.i.captions.description,
		parser: value => value,
	},
	valtype: {
		caption: mainStore.t.i.captions.type,
		parser: value => Number(value),
	},
	enum: {
		caption: mainStore.t.i.captions.default,
		sortBy: 'baseval',
	},
	folderid: {
		caption: mainStore.t.i.captions.folder,
		parser: value => value === '' ? null : value,
	},
	srt: {
		caption: mainStore.t.i.captions.srt,
		parser: value => Number(value),
	},
};

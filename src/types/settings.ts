import { Folder } from '@/types';

export type SettingsContext = 'user';
export type SettingType = null | boolean | number | string;

export interface SettingEnum {
	val: SettingType;
	srt: number;
	extra?: string;
}
export interface SettingsVocRec {
	id: string;
	valtype: number;
	baseval: SettingType;
	folderid: string | null;
	srt: number;
	enum?: SettingEnum[];
	name?: string;
	description?: string;
	checked?: boolean;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface Setting extends SettingsVocRec {
	type: 'setting';
	val: SettingType;
}
export interface Settings {
	groups: Record<string, Folder>;
	user?: Record<string, Setting>;
	usersvoc?: Record<string, SettingsVocRec>;
}
export interface SettingsMain extends Settings {
	user: Record<string, Setting>;
}
export interface SettingsAdmin extends Settings {
	usersvoc: Record<string, SettingsVocRec>;
}

export const SETTING_COLLECTION_KEYS = ['user', 'groups'] as const;
export type SettingCollectionKey = typeof SETTING_COLLECTION_KEYS[number];
export interface SettingCollection {
	groups?: Partial<Folder>[];
	user?: Partial<Setting>[];
	usersvoc?: Partial<SettingsVocRec>[];
}

export const BUFFER_SETTING_COLLECTION_KEYS = ['user', 'groups'] as const;
export type BufferSettingCollectionKey = typeof BUFFER_SETTING_COLLECTION_KEYS[number];
export type BufferSettingCollection = SettingCollection;

export enum SettingKey {
	Lang = '1',
	ColorTheme = '2',
};

export const vocLangs = [
	{ val: 'en' , extra: 'langEn' },
	{ val: 'ru' , extra: 'langRu' },
];
export const vocColorThemes = [
	{ val: 'brown'        , extra: 'colorthemeBrown'       },
	{ val: 'blue'         , extra: 'colorthemeBlue'        },
	{ val: 'pink'         , extra: 'colorthemePink'        },
	{ val: 'green'        , extra: 'colorthemeGreen'       },
	{ val: 'pink-light'   , extra: 'colorthemePinkLight'   },
	{ val: 'blue-light'   , extra: 'colorthemeBlueLight'   },
	{ val: 'purple-light' , extra: 'colorthemePurpleLight' },
	{ val: 'green-light'  , extra: 'colorthemeGreenLight'  },
];

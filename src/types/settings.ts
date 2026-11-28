import { Folder } from '@/types';

export type SettingsContext = 'user' | 'admin';
export type SettingType = null | boolean | number | string;
export const typeNumber = {
	bigint: 2,
	symbol: 3,
	undefined: 0,
	object: 0,
	function: 0,
	null: 0,
	boolean: 1,
	number: 2,
	string: 3,
} as const;

export interface Setting {
	type: 'setting';
	id: string;
	val: SettingType;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface SettingsVocRec {
	type: 'settingsvocrec';
	id: string;
	valtype: number;
	baseval: SettingType;
	folderid: string | null;
	srt: number;
	public: boolean;
	enumid?: string;
	name?: string;
	description?: string;
	checked?: boolean;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface SettingsEnum {
	type: 'settingsenum';
	id: string;
	valtype: number;
	srt: number;
	name?: string;
	description?: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface SettingsOption {
	type: 'settingsoption';
	id: string;
	enumid: string;
	val: Exclude<SettingType, null | boolean>;
	srt: number;
	enabled: boolean;
	extra?: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface Settings {
	enums: Record<string, SettingsEnum>;
	groups: Record<string, Folder>;
	options: Record<string, SettingsOption>;
	usersvoc: Record<string, SettingsVocRec>;
	user?: Record<string, Setting>;
}
export interface SettingsMain extends Settings {
	user: Record<string, Setting>;
}
export interface SettingsAdmin extends Settings {
	usersvoc: Record<string, SettingsVocRec>;
}

export interface DBSettingsGroup {
	id: number;
	parent: number | null,
	srt: number,
	name?: string;
	description?: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface DBSettingsEnum {
	id: number;
	type: number;
	srt: number;
	name?: string;
	description?: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface DBSettingsOption {
	id: number;
	enumid: number,
	value: Exclude<SettingType, null | boolean>;
	srt: number,
	enabled: boolean;
	extra?: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface DBSettingsVocRec {
	id: number;
	groupid: number | null,
	type: number;
	baseval: SettingType;
	srt: number;
	public: boolean;
	enumid?: number,
	name?: string;
	description?: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}
export interface DBSettingsUser {
	settingid: number,
	value: SettingType;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
}

export type SettingKey = keyof Setting;
export type SettingsVocRecKey = keyof SettingsVocRec;

export const SETTING_COLLECTION_KEYS = ['enums', 'groups', 'options', 'usersvoc', 'user'] as const;
export type SettingCollectionKey = typeof SETTING_COLLECTION_KEYS[number];
export interface SettingCollection {
	enums?: Partial<SettingsEnum>[];
	groups?: Partial<Folder>[];
	options?: Partial<SettingsOption>[];
	usersvoc?: Partial<SettingsVocRec>[];
	user?: Partial<Setting>[];
}
export interface SettingCollectionToBack {
	enums?: Partial<DBSettingsEnum>[];
	groups?: Partial<DBSettingsGroup>[];
	options?: Partial<DBSettingsOption>[];
	usersvoc?: Partial<DBSettingsVocRec>[];
	user?: Partial<DBSettingsUser>[];
}

export const BUFFER_SETTING_COLLECTION_KEYS = ['user'] as const;
export type BufferSettingCollectionKey = typeof BUFFER_SETTING_COLLECTION_KEYS[number];
export type BufferSettingCollection = SettingCollection;

export enum SettingKeyEnum {
	Lang = '1',
	ColorTheme = '2',
};

export const vocLangs = [
	{ val: 'en' , extra: 'langEn' },
	{ val: 'ru' , extra: 'langRu' },
	{ val: 'zh' , extra: 'langZh' },
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

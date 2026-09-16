import { Folder } from '@/types';

export type SettingsContext = 'user';
export type SettingType = null | boolean | number | string;

export interface SettingEnum {
	val: SettingType;
	srt: number;
	extra?: string;
}
export interface SettingsVocRec {
	valtype: number;
	folderid: string;
	baseval: SettingType;
	srt: number;
	enum?: SettingEnum[];
	name?: string;
	description?: string;
}
export interface Setting extends SettingsVocRec {
	id: string;
	type: 'setting';
	val: SettingType;
}
export interface Settings {
	user: Record<string, SettingType>;
	vocs: {
		user: Record<string, SettingsVocRec>;
	};
	groups: Record<string, Folder>;
}
export enum SettingKey {
	Lang = 1,
	ColorTheme = 2,
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

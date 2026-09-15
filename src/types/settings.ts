export type SettingsContext = 'user';
export type SettingType = null | boolean | number | string;

export interface SettingsGroup {
	id: number;
	parent: number | null;
	srt: number;
	name?: string;
	description?: string;
}
export interface SettingEnum {
	val: SettingType;
	srt: number;
	extra?: string;
}
export interface SettingsVocRec {
	type: number;
	baseval: SettingType;
	enum?: SettingEnum[];
	name?: string;
	description?: string;
}
export interface Settings {
	user: Record<number, SettingType>;
	vocs: {
		user: Record<number, SettingsVocRec>;
	};
	groups: {
		user?: SettingsGroup[];
	};
}
export enum SettingKey {
	Lang = 1,
	ColorTheme = 2,
};

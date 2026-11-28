import api from '@/api';
import {
    DBSettingsEnum,
	DBSettingsGroup,
	DBSettingsOption,
	DBSettingsUser,
	DBSettingsVocRec,
} from '@/types/settings';
import {
    isDBSettingsEnum,
	isDBSettingsGroup,
    isDBSettingsOption,
	isDBSettingsUser,
	isDBSettingsVocRec,
	isRecord,
} from '@/guards';

export const routineGetSettingsGroups = async (): Promise<Record<string, DBSettingsGroup>> => {
	const data = await api.get('get_settings_groups.php');
	if (!isRecord(data)) return {};
	const rec: Record<string, DBSettingsGroup> = {};
	for (const id in data) {
		if (!Object.hasOwn(data, id) || !isDBSettingsGroup(data[id])) continue;
		rec[id] = data[id];
	}
	return rec;
};
export const routineGetSettingsUser = async (): Promise<Record<string, DBSettingsUser>> => {
	const userid = localStorage.getItem('places-useruuid');
	const sessionid = localStorage.getItem('places-session');
	if (!userid || !sessionid) return {};
	const data = await api.post(`get_settings_users.php`, { userid, sessionid });
	if (!isRecord(data)) return {};
	const rec: Record<string, DBSettingsUser> = {};
	for (const id in data) {
		if (!Object.hasOwn(data, id) || !isDBSettingsUser(data[id])) continue;
		rec[id] = data[id];
	}
	return rec;
};
export const routineGetSettingsUsersVoc = async (): Promise<Record<string, DBSettingsVocRec>> => {
	const userid = localStorage.getItem('places-useruuid');
	const sessionid = localStorage.getItem('places-session');
	if (!userid || !sessionid) return {};
	const data = await api.post(`get_settings_users_voc.php`, { userid, sessionid });
	if (!isRecord(data)) return {};
	const rec: Record<string, DBSettingsVocRec> = {};
	for (const id in data) {
		if (!Object.hasOwn(data, id) || !isDBSettingsVocRec(data[id])) continue;
		rec[id] = data[id];
	}
	return rec;
};
export const routineGetSettingsEnums = async (): Promise<Record<string, DBSettingsEnum>> => {
	const data = await api.get('get_settings_enums.php');
	if (!isRecord(data)) return {};
	const rec: Record<string, DBSettingsEnum> = {};
	for (const id in data) {
		if (!Object.hasOwn(data, id) || !isDBSettingsEnum(data[id])) continue;
		rec[id] = data[id];
	}
	return rec;
};
export const routineGetSettingsOptions = async (): Promise<Record<string, DBSettingsOption>> => {
	const data = await api.get('get_settings_options.php');
	if (!isRecord(data)) return {};
	const rec: Record<string, DBSettingsOption> = {};
	for (const id in data) {
		if (!Object.hasOwn(data, id) || !isDBSettingsOption(data[id])) continue;
		rec[id] = data[id];
	}
	return rec;
};

import {
	Account,
	BufferCollectionKey, BUFFER_COLLECTION_KEYS,
	BufferEntityCollectionKey, BUFFER_ENTITY_COLLECTION_KEYS,
	DictKey, DICT_KEYS,
	EntityCollectionKey, ENTITY_COLLECTION_KEYS,
	Folder,
	Group,
	Image,
	ImageableContext, IMAGEABLE_CONTEXT,
	ImageableEntity,
	Measure,
	Place,
	Point,
	PointDescription,
	Route,
	TreeItemType, TREE_ITEM_TYPES,
	User,
} from '@/types';
import {
	BufferSettingCollectionKey, BUFFER_SETTING_COLLECTION_KEYS,
	Setting,
	SettingCollectionKey, SETTING_COLLECTION_KEYS,
	SettingEnum,
	SettingType,
	SettingsVocRec,
} from '@/types/settings';

export const isOptionalString = (value: unknown): boolean =>
	value === undefined || typeof value === 'string'
;
export const isOptionalNumber = (value: unknown): boolean =>
	value === undefined || typeof value === 'number'
;
export const isOptionalBoolean = (value: unknown): boolean =>
	value === undefined || typeof value === 'boolean'
;

export const isRecord = (value: unknown): value is Record<string, unknown> => {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
};
export const isGroup = (value: unknown): value is Group => {
	if (
		!isRecord(value) ||
		typeof value.id !== 'string' ||
		typeof value.owner !== 'string' ||
		typeof value.system !== 'boolean' ||
		typeof value.haschildren !== 'boolean' ||
		(typeof value.parent !== 'string' && value.parent !== null) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description) ||
		!isOptionalBoolean(value.checked)
	) {
		return false;
	}
	return true;
};
export const isUser = (value: unknown): value is User => {
	if (
		!isRecord(value) ||
		typeof value.id !== 'string' ||
		typeof value.login !== 'string' ||
		typeof value.confirmed !== 'boolean' ||
		typeof value.testaccount !== 'boolean' ||
		(typeof value.homeplace !== 'string' && value.homeplace !== null) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.email) ||
		!isOptionalString(value.phone) ||
		!isOptionalNumber(value.lastupdates) ||
		!isOptionalNumber(value.confirmbefore)/* ||
		('groups' in value && !isGroups(value.groups))*/
	) {
		return false;
	}
	return true;
};
export const isGroups = (value: unknown): value is Record<string, Group> => {
	if (!isRecord(value)) return false;
	let isValid = true;
	for (const key in value) {
		if (!Object.hasOwn(value, key)) continue;
		if (!isGroup(value[key])) { isValid = false; break; }
	}
	if (!isValid) return false;
	return true;
};
export const isUsers = (value: unknown): value is Record<string, User> => {
	if (!isRecord(value)) return false;
	let isValid = true;
	for (const key in value) {
		if (!Object.hasOwn(value, key)) continue;
		if (!isUser(value[key])) { isValid = false; break; }
	}
	if (!isValid) return false;
	return true;
};
export const isAccount = (value: unknown): value is Account => {
	if (!isUser(value)) return false;
	const account = value as Account;
	if (
		!isOptionalString(account.password) ||
		!isOptionalString(account.passwordnew) ||
		!isOptionalString(account.passwordnewrepeat) ||
		account.passwordnew !== account.passwordnewrepeat
	) {
		return false;
	}
	return true;
};
export const isSettingType = (value: unknown): value is SettingType =>
	value === null ||
	typeof value === 'boolean' ||
	typeof value === 'number' ||
	typeof value === 'string'
;
export const isSettingEnum = (value: unknown): value is SettingEnum => {
	if (
		!isRecord(value) ||
		typeof value.srt !== 'number' ||
		!isSettingType(value.val) ||
		!isOptionalString(value.extra)
	) {
		return false;
	}
	return true;
};
export const isSettingsVocRec = (value: unknown): value is SettingsVocRec => {
	if (
		!isRecord(value) ||
		typeof value.id !== 'string' ||
		typeof value.srt !== 'number' ||
		typeof value.valtype !== 'number' ||
		(typeof value.folderid !== 'string' && value.folderid !== null) ||
		!isSettingType(value.baseval) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description) ||
		(value.enum !== undefined && (
			!Array.isArray(value.enum) ||
			!value.enum.every(isSettingEnum)
		))
	) {
		return false;
	}
	return true;
};
export const isSetting = (value: unknown): value is Setting => {
	if (
		!isSettingsVocRec(value) ||
		(value as Setting).type !== 'setting' ||
		!isSettingType((value as Setting).type)
	) {
		return false;
	}
	return true;
};
export const isFolder = (value: unknown): value is Folder => {
	if (
		!isRecord(value) ||
		value.type !== 'folder' ||
		typeof value.srt !== 'number' ||
		(typeof value.id !== 'string' && value.id !== null) ||
		(typeof value.parent !== 'string' && value.parent !== null) ||
		!isOptionalBoolean(value.virtual) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description)
	) {
		return false;
	}
	return true;
};
export const isPoint = (value: unknown): value is Point => {
	if (
		!isRecord(value) ||
		value.type !== 'point' ||
		typeof value.id !== 'string' ||
		typeof value.latitude !== 'number' ||
		typeof value.longitude !== 'number' ||
		('altitude' in value && value.altitude !== null && !isOptionalNumber(value.altitude))
	) {
		return false;
	}
	return true;
};
export const isPlace = (value: unknown): value is Place => {
	if (
		!isRecord(value) ||
		value.type !== 'place' ||
		typeof value.id !== 'string' ||
		typeof value.pointid !== 'string' ||
		typeof value.srt !== 'number' ||
		(typeof value.folderid !== 'string' && value.folderid !== null) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description) ||
		!isOptionalString(value.link) ||
		!isOptionalNumber(value.time)
	) {
		return false;
	}
	return true;
};
export const isRoute = (value: unknown): value is Route => {
	if (
		!isRecord(value) ||
		value.type !== 'route' ||
		!Array.isArray(value.points) ||
		typeof value.id !== 'string' ||
		typeof value.srt !== 'number' ||
		(typeof value.folderid !== 'string' && value.folderid !== null) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description) ||
		!isOptionalString(value.link) ||
		!isOptionalNumber(value.time)
	) {
		return false;
	}
	return true;
};
export const isImage = (value: unknown): value is Image => {
	if (
		!isRecord(value) ||
		typeof value.type !== 'string' ||
		typeof value.id !== 'string' ||
		typeof value.file !== 'string' ||
		typeof value.lastmodified !== 'number' ||
		typeof value.size !== 'number' ||
		typeof value.srt !== 'number' ||
		!isOptionalString(value.placeid) ||
		!isOptionalString(value.routeid)
	) {
		return false;
	}
	return true;
};
export const isMeasure = (value: unknown): value is Measure => {
	if (
		!isRecord(value) ||
		value.type !== 'measure' ||
		!Array.isArray(value.points) ||
		!isOptionalString(value.id) ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description)
	) {
		return false;
	}
	return true;
};
export const isPointDescription = (value: unknown): value is PointDescription => {
	if (
		!isRecord(value) ||
		typeof value.id !== 'string' ||
		!isOptionalString(value.name) ||
		!isOptionalString(value.description)
	) {
		return false;
	}
	return true;
};
export const isDictKey = (value: unknown): value is DictKey => {
	return typeof value === 'string' && (DICT_KEYS as readonly string[]).includes(value);
};
export const isImageableContext = (value: unknown): value is ImageableContext => {
	return typeof value === 'string' && (IMAGEABLE_CONTEXT as readonly string[]).includes(value);
};
export const isEntityCollectionKey = (value: unknown): value is EntityCollectionKey => {
	return typeof value === 'string' && (ENTITY_COLLECTION_KEYS as readonly string[]).includes(value);
};
export const isSettingCollectionKey = (value: unknown): value is SettingCollectionKey => {
	return typeof value === 'string' && (SETTING_COLLECTION_KEYS as readonly string[]).includes(value);
};
export const isBufferEntityCollectionKey = (value: unknown): value is BufferEntityCollectionKey => {
	return typeof value === 'string' && (BUFFER_ENTITY_COLLECTION_KEYS as readonly string[]).includes(value);
};
export const isBufferSettingCollectionKey = (value: unknown): value is BufferSettingCollectionKey => {
	return typeof value === 'string' && (BUFFER_SETTING_COLLECTION_KEYS as readonly string[]).includes(value);
};
export const isBufferCollectionKey = (value: unknown): value is BufferCollectionKey => {
	return typeof value === 'string' && (BUFFER_COLLECTION_KEYS as readonly string[]).includes(value);
};
export const isImageableCollectionKey = (key: unknown): key is 'places' | 'routes' => {
	return typeof key === 'string' && (key === 'places' || key === 'routes');
};
export const isImageableEntity = (value: unknown): value is ImageableEntity => {
	return isPlace(value) || isRoute(value);
};
export const isTreeItemType = (value: unknown): value is TreeItemType => {
	if (
		typeof value !== 'string' ||
		!(TREE_ITEM_TYPES as readonly string[]).includes(value)
	) {
		return false;
	}
	return true;
};
export const hasKey = <T extends object>(obj: T, key: PropertyKey): key is keyof T => {
	return key in obj;
}
export const hasOwnStringKey =
	<T extends object>(value: T, key: string): key is Extract<keyof T, string> => {
	return Object.hasOwn(value, key);
};
export const isFileInput = (value: unknown): value is HTMLInputElement & { files: FileList } => {
	if (
		!(value instanceof HTMLInputElement) ||
		value.type !== 'file' ||
		value.files === null
	) {
		return false;
	}
	return true;
};

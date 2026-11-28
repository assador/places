import {
	Account,
	BufferCollectionKey, BUFFER_COLLECTION_KEYS,
	BufferEntityCollectionKey, BUFFER_ENTITY_COLLECTION_KEYS,
	DictKey, DICT_KEYS,
	EntityCollection,
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
	DBSettingsEnum,
	DBSettingsGroup,
	DBSettingsOption,
	DBSettingsUser,
	DBSettingsVocRec,
	Setting,
	SettingCollectionKey, SETTING_COLLECTION_KEYS,
	SettingType,
	SettingsEnum,
	SettingsOption,
	SettingsVocRec,
} from '@/types/settings';
import { StoreMainStateRefs, StoreAdminStateRefs } from '@/stores/types';

export const isOptionalString = (value: unknown): boolean =>
	value === undefined || typeof value === 'string'
;
export const isOptionalNumber = (value: unknown): boolean =>
	value === undefined || typeof value === 'number'
;
export const isOptionalBoolean = (value: unknown): boolean =>
	value === undefined || typeof value === 'boolean'
;
export const isNullNumericString = (value: unknown): boolean => {
	if (typeof value !== 'string') return false;
	const num = Number(value);
	return Number.isSafeInteger(num) && num > 0 && String(num) === value;
};
export const isOptionalNullNumericString = (value: unknown): boolean => {
	if (value === null) return true;
	if (typeof value !== 'string') return false;
	const num = Number(value);
	return Number.isSafeInteger(num) && num > 0 && String(num) === value;
};

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
		(Object.hasOwn(value, 'groups') && !isGroups(value.groups))*/
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
export const isDBSettingsEnum = (value: unknown): value is DBSettingsEnum =>
	isRecord(value) &&
	typeof value.id === 'number' &&
	typeof value.type === 'number' &&
	typeof value.srt === 'number' &&
	isOptionalString(value.name) &&
	isOptionalString(value.description)
;
export const isDBSettingsGroup = (value: unknown): value is DBSettingsGroup =>
	isRecord(value) &&
	typeof value.id === 'number' &&
	typeof value.srt === 'number' &&
	(typeof value.parent === 'number' || value.parent === null) &&
	isOptionalString(value.name) &&
	isOptionalString(value.description)
;
export const isDBSettingsOption = (value: unknown): value is DBSettingsOption =>
	isRecord(value) &&
	typeof value.id === 'number' &&
	typeof value.enumid === 'number' &&
	typeof value.srt === 'number' &&
	typeof value.enabled === 'boolean' &&
	isSettingType(value.value) &&
	value.value !== null &&
	typeof value.value !== 'boolean' &&
	isOptionalString(value.extra)
;
export const isDBSettingsVocRec = (value: unknown): value is DBSettingsVocRec =>
	isRecord(value) &&
	typeof value.id === 'number' &&
	typeof value.type === 'number' &&
	typeof value.srt === 'number' &&
	typeof value.public === 'boolean' &&
	(typeof value.groupid === 'number' || value.groupid === null) &&
	isSettingType(value.baseval) &&
	isOptionalNumber(value.enumid) &&
	isOptionalString(value.name) &&
	isOptionalString(value.description)
;
export const isDBSettingsUser = (value: unknown): value is DBSettingsUser =>
	isRecord(value) &&
	typeof value.settingid === 'number' &&
	isSettingType(value.value)
;
export const isSettingsEnum = (value: unknown): value is SettingsEnum =>
	isRecord(value) &&
	value.type === 'settingsenum' &&
	typeof value.id === 'string' &&
	typeof value.valtype === 'number' &&
	typeof value.srt === 'number' &&
	isOptionalString(value.name) &&
	isOptionalString(value.description)
;
export const isSettingsOption = (value: unknown): value is SettingsOption =>
	isRecord(value) &&
	value.type === 'settingsoption' &&
	typeof value.id === 'string' &&
	typeof value.enumid === 'string' &&
	typeof value.srt === 'number' &&
	typeof value.enabled === 'boolean' &&
	isSettingType(value.val) &&
	value.val !== null &&
	typeof value.val !== 'boolean' &&
	isOptionalString(value.extra)
;
export const isSetting = (value: unknown): value is Setting =>
	isRecord(value) &&
	value.type === 'setting' &&
	typeof value.id === 'string' &&
	isSettingType(value.val)
;
export const isSettingsVocRec = (value: unknown): value is SettingsVocRec =>
	isRecord(value) &&
	value.type === 'settingsvocrec' &&
	typeof value.id === 'string' &&
	typeof value.valtype === 'number' &&
	typeof value.srt === 'number' &&
	typeof value.public === 'boolean' &&
	(typeof value.folderid === 'string' || value.folderid === null) &&
	isSettingType(value.baseval) &&
	isOptionalString(value.enumid) &&
	isOptionalString(value.name) &&
	isOptionalString(value.description)
;
export const isValidSettingValue = (value: unknown, valtype: number): value is SettingType => {
	switch (valtype) {
		case 0: return value === null;
		case 1: return typeof value === 'boolean';
		case 2: return typeof value === 'number' && Number.isFinite(value);
		case 3: return typeof value === 'string';
		default: return false;
	}
};
export const isValidSettingsEnum = (entity: unknown): entity is SettingsEnum =>
	isSettingsEnum(entity) &&
	isNullNumericString(entity.id)
;
export const isValidSettingsOption = (entity: unknown): entity is SettingsOption =>
	isSettingsOption(entity) &&
	isNullNumericString(entity.id) &&
	isNullNumericString(entity.enumid)
;
export const isValidSettingsVocRec = (entity: unknown): entity is SettingsVocRec =>
	isSettingsVocRec(entity) &&
	isNullNumericString(entity.id) &&
	isOptionalNullNumericString(entity.folderid) &&
	isValidSettingValue(entity.baseval, entity.valtype)
;
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
		(
			Object.hasOwn(value, 'altitude') &&
			value.altitude !== null &&
			typeof value.altitude !== 'number'
		)
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

// SEC Stores

export const isStoreMainStateRefs = (value: unknown): value is StoreMainStateRefs => {
	return (
		isRecord(value) &&
		Object.hasOwn(value, 'user')
	);
};
export const isStoreAdminStateRefs = (value: unknown): value is StoreAdminStateRefs => {
	return (
		isRecord(value) &&
		Object.hasOwn(value, 'users')
	);
};

// SEC Import

export const isImportedFolder = (value: unknown): value is Partial<Folder> => {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		(typeof value.parent === 'string' || value.parent === null)
	);
};
export const isImportedPoint = (value: unknown): value is Partial<Point> => {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.latitude === 'number' &&
		typeof value.longitude === 'number'
	);
};
export const isImportedPlace = (value: unknown): value is Partial<Place> => {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.pointid === 'string' &&
		(typeof value.folderid === 'string' || value.folderid === null)
	);
};
export const isImportedRoute = (value: unknown): value is Partial<Route> => {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.pointid === 'string' &&
		(typeof value.folderid === 'string' || value.folderid === null) &&
		Array.isArray(value.points)
	);
};
export const isEntityCollection = (value: unknown): value is EntityCollection => {
	if (!isRecord(value)) return false;

	const guards = {
		folders: isImportedFolder,
		points: isImportedPoint,
		places: isImportedPlace,
		routes: isImportedRoute,
	};
	for (const key of BUFFER_ENTITY_COLLECTION_KEYS) {
		const collection = value[key];
		if (
			collection !== undefined &&
			(!Array.isArray(collection) || !collection.every(guards[key]))
		) {
			return false;
		}
	}
	return true;
};

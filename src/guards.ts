import {
	Account,
	DictKey, DICT_KEYS,
	EntityCollectionKeys, ENTITY_COLLECTION_KEYS,
	Folder,
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

const isOptionalString = (value: unknown): boolean =>
	value === undefined || typeof value === 'string'
;
const isOptionalNumber = (value: unknown): boolean =>
	value === undefined || typeof value === 'number'
;
const isOptionalBoolean = (value: unknown): boolean =>
	value === undefined || typeof value === 'boolean'
;

export const isRecord = (value: unknown): value is Record<string, unknown> => {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
};
export const isGroupsArray = (value: unknown): value is { group: string; parent: string; }[] => {
	if (!Array.isArray(value)) {
		return false;
	}
	const isValid = value.every(item =>
			isRecord(item) &&
			typeof item.group === 'string' &&
			typeof item.parent === 'string'
	);
	if (!isValid) {
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
		!isOptionalNumber(value.confirmbefore) ||
		('groups' in value && !isGroupsArray(value.groups))
	) {
		return false;
	}
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
export const isFolder = (value: unknown): value is Folder => {
	if (
		!isRecord(value) ||
		value.type !== 'folder' ||
		typeof value.name !== 'string' ||
		typeof value.srt !== 'number' ||
		(typeof value.id !== 'string' && value.id !== null) ||
		(typeof value.parent !== 'string' && value.parent !== null) ||
		!isOptionalBoolean(value.virtual) ||
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
		typeof value.name !== 'string' ||
		typeof value.srt !== 'number' ||
		(typeof value.folderid !== 'string' && value.folderid !== null) ||
		!isOptionalString(value.link) ||
		!isOptionalString(value.time) ||
		!isOptionalString(value.description)
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
		typeof value.name !== 'string' ||
		typeof value.srt !== 'number' ||
		(typeof value.folderid !== 'string' && value.folderid !== null) ||
		!isOptionalString(value.link) ||
		!isOptionalString(value.time) ||
		!isOptionalString(value.description)
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
	if (
		typeof value !== 'string' ||
		!(DICT_KEYS as readonly string[]).includes(value)
	) {
		return false;
	}
	return true;
};
export const isImageableContext = (value: unknown): value is ImageableContext => {
	if (
		typeof value !== 'string' ||
		!(IMAGEABLE_CONTEXT as readonly string[]).includes(value)
	) {
		return false;
	}
	return true;
};
export const isEntityCollectionKey = (value: unknown): value is EntityCollectionKeys => {
	if (
		typeof value !== 'string' ||
		!(ENTITY_COLLECTION_KEYS as readonly string[]).includes(value)
	) {
		return false;
	}
	return true;
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

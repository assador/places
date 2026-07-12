import {
	Folder,
	Point,
	Place,
	Route,
	Measure,
	PointDescription,
	DictKey, DICT_KEYS,
	TreeItemType, TREE_ITEM_TYPES,
} from '@/types';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
};
export const isFolder = (obj: unknown): obj is Folder =>
	isRecord(obj) && obj.type === 'folder' && typeof obj.id === 'string'
;
export const isPoint = (obj: unknown): obj is Point =>
	isRecord(obj) && obj.type === 'point' && typeof obj.id === 'string'
;
export const isPlace = (obj: unknown): obj is Place =>
	isRecord(obj) && obj.type === 'place' && typeof obj.id === 'string'
;
export const isRoute = (obj: unknown): obj is Route =>
	isRecord(obj) && obj.type === 'route' && typeof obj.id === 'string'
;
export const isMeasure = (obj: unknown): obj is Measure =>
	isRecord(obj) && obj.type === 'measure' && typeof obj.id === 'string'
;
export const isPointDescription = (obj: unknown): obj is PointDescription =>
	isRecord(obj) &&
	typeof obj.id === 'string' &&
	(obj.name === undefined || typeof obj.name === 'string') &&
	(obj.description === undefined || typeof obj.description === 'string')
;
export const isDictKey = (value: unknown): value is DictKey =>
	typeof value === 'string' && (DICT_KEYS as readonly string[]).includes(value)
;
export const isTreeItemType = (value: unknown): value is TreeItemType =>
	typeof value === 'string' && (TREE_ITEM_TYPES as readonly string[]).includes(value)
;
export const hasOwnStringKey =
	<T extends object>(obj: T, key: string): key is Extract<keyof T, string> =>
		Object.hasOwn(obj, key)
;

import 'axios';

declare module 'axios' {
	export interface AxiosRequestConfig {
		silent?: boolean;
	}
	export interface InternalAxiosRequestConfig {
		silent?: boolean;
	}
}

// SEC Entities

export interface Entity {
	type: string;
	id: string | null;
	userid: string | null;
	common: boolean;
	enabled: boolean;
	show: boolean;
	added: boolean;
	deleted: boolean;
	updated: boolean;
}
export interface Folder extends Entity {
	type: 'folder';
	context: FolderContext;
	virtual?: boolean;
	parent: string | null;
	name: string;
	description?: string;
	srt: number;
	geomarks: GeomarksState;
	open: boolean;
	children?: Record<string, Folder> | Folder[];
}
export interface Point extends Entity {
	type: 'point';
	id: string;
	latitude: number;
	longitude: number;
	altitude?: number | null;
	time?: string;
}
export interface Place extends Entity {
	type: 'place';
	id: string;
	folderid: string | null;
	pointid: string | null;
	name: string;
	description?: string;
	link?: string;
	time?: string;
	srt: number;
	geomark: number | boolean;
	images?: Record<string, Image>;
	home?: boolean;
}
export interface Route extends Entity {
	type: 'route';
	id: string;
	folderid: string | null;
	points: PointDescription[];
	choosing: number | null;
	name: string;
	description?: string;
	link?: string;
	time?: string;
	srt: number;
	geomarks: GeomarksState;
	images?: Record<string, Image>;
}
export interface Image {
	type: string;
	id: string;
	file: string;
	lastmodified: number;
	size: number;
	srt: number;
	placeid?: string;
	routeid?: string;
	new?: boolean;
	preview?: string;
	raw?: File;
}
export interface EntityCollection {
	folders?: Partial<Folder>[];
	points?: Partial<Point>[];
	places?: Partial<Place>[];
	routes?: Partial<Route>[];
	images?: Partial<Image>[];
}
export interface TreeEntityCollection {
	folders: Record<string, Folder>;
	places: Record<string, Place>;
	routes: Record<string, Route>;
}
export interface RawImage {
	id: string;
	raw: File;
	entityid: string;
	entitytype: 'place' | 'route';
}
export interface Tree {
	name?: string;
	open?: boolean;
	context: string;
}
export interface User {
	id: string;
	login: string;
	password: string;
	name: string;
	email: string;
	phone: string;
	homeplace: string | null;
	groups?: { group: string, parent: string }[];
	testaccount: boolean;
	confirmed: boolean;
	confirmbefore: string;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
	checked?: boolean;
	lastupdates: number;
}
export interface Group {
	id: string;
	parent: string;
	name: string;
	description: string;
	owner: string;
	system: boolean;
	haschildren: boolean;
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
	checked?: boolean;
}
export interface PointDescription {
	id: string;
	name?: string;
	description?: string;
}
export interface FatPointDescription extends PointDescription {
	point: Point;
	context?: PointInfoContext;
	index?: number;
	key?: string;
}
export interface Measure {
	type: string;
	points: PointDescription[];
	choosing: number | null;
	show: boolean;
	id?: string;
	name?: string;
	description?: string;
}
export interface FatPointsPack {
	type: 'pointspack';
	name: string;
	points: FatPointDescription[];
	choosing: number | null;
	show: boolean;
	id?: string;
}
export interface PointInfo extends FatPointDescription {
	of?: Place | Route | Measure | FatPointsPack;
}
export interface FirstShow {
	show: boolean;
	first: boolean;
}

// SEC Popups

export interface PopupPosition {
	top: string | null;
	right: string | null;
	bottom: string | null;
	left: string | null;
}
export interface PopupProps {
	show: boolean;
	what?: string;
	closeButton?: boolean;
	closeOnClick?: boolean;
	position?: PopupPosition;
}
export interface PopupEntityMenuProps extends PopupProps {
	object: Folder | Place | Route | null;
	context: MetaEntityContext | null;
	lastEvent: PointerEvent | null;
}

// SEC DnD

export interface DragPayload {
	id: string;
	type: 'folder' | 'place' | 'route' | 'point' | 'image';
	context: string;
}
export interface DragEntityPayload extends DragPayload {
	context: Context;
	parentId?: string;
	index?: number;
	dragging?: boolean;
	position?: 'before' | 'onto' | 'after';
	ghostSelector?: string;
	startTime?: number;
	nondraggable?: boolean;
}
export interface DragFolderPayload extends DragEntityPayload {
	context: 'folders';
}
export interface DragPointPayload extends DragEntityPayload {
	context: 'points';
}
export interface DragPlacePayload extends DragEntityPayload {
	context: 'places';
}
export interface DragRoutePayload extends DragEntityPayload {
	context: 'routes';
}
export interface DragPointInListPayload extends DragEntityPayload {
	context: 'routes' | 'measure';
	index: number;
}
export interface DragImagePayload extends DragEntityPayload {
	context: 'places' | 'routes';
	index: number;
}
export type DragHandler = (payload: DragPayload, target: HTMLElement) => void;

// SEC Langs

import { getT } from '@/lang/en';
export type Dictionary = ReturnType<typeof getT>;

// SEC Types

export const DICT_KEYS = ['folders', 'points', 'places', 'routes'] as const;
export type DictKey = typeof DICT_KEYS[number];

export const TREE_ITEM_TYPES = ['folder', 'place', 'route'] as const;
export type TreeItemType = typeof TREE_ITEM_TYPES[number];

export type Context =
	| 'folders'
	| 'points'
	| 'places'
	| 'routes'
	| 'images'
	| 'measure'
	| 'temps'
;
export type PointContext =
	| 'points'
	| 'temps'
;
export type MetaEntityContext =
	| 'places'
	| 'routes'
;
export type PointInfoContext =
	| 'places'
	| 'routes'
	| 'measure'
	| 'temps'
;
export type PointCollectionContext =
	| 'routes'
	| 'measure'
	| 'temps'
;
export type Mode =
	| 'normal'
	| 'routes'
	| 'measure'
;
export type FolderContext =
	| 'places'
	| 'routes'
;
export type ImportExportFormat =
	| 'json'
	| 'gpx'
;
export enum GeomarksState {
	None = 0,
	All = 1,
	Partial = 2,
};

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
	userid: string;
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
	children?: Record<string, Folder>;
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
	folderid: string;
	pointid: string;
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
	folderid: string;
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
}
export interface EntityCollection {
	folders?: Partial<Folder>[];
	points?: Partial<Point>[];
	places?: Partial<Place>[];
	routes?: Partial<Route>[];
	images?: Partial<Image>[];
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
	homeplace: string;
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
	index: number;
	key: string;
}
export interface Measure<T extends PointDescription = PointDescription> {
	type: string;
	points: T[];
	choosing: number | null;
	show: boolean;
	id?: string;
	name?: string;
	description?: string;
}
export interface PointInfo<
	T extends PointDescription = FatPointDescription
> extends FatPointDescription {
	of?: Place | Route | Measure<T> | null;
}
export interface FirstShow {
	show: boolean;
	first: boolean;
}

// SEC Popups

export interface PopupPosition {
	top: number | string | null;
	right: number | string | null;
	bottom: number | string | null;
	left: number | string | null;
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
}

// SEC DnD

export interface DragPayload {
	id: string;
	type: string;
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

// SEC Store

export interface IMainState {
	activeMapIndex: number;
	backup: boolean;
	busyCount: number;
	center: Record<string, number>;
	centerMarkerShow: boolean;
	colortheme: string;
	commonMarkersShow: boolean;
	commonPlaces: Record<string, Place>;
	commonPlacesOnPageCount: number;
	commonPlacesPage: number;
	commonPlacesShow: boolean;
	commonRoutes: Record<string, Route>;
	commonRoutesOnPageCount: number;
	commonRoutesPage: number;
	commonRoutesShow: boolean;
	currentDrag: DragEntityPayload;
	currentPlaceId: string | null;
	currentPointId: string | null;
	currentRouteId: string | null;
	first: boolean;
	folders: Record<string, Folder>;
	idleTime: number;
	lang: string;
	langs: Record<string, string>[];
	measure: Measure;
	messages: string[];
	messagesMouseOver: boolean;
	messagesInterval: number | null;
	messagesTimeout: number | null;
	mode: Mode;
	newEntityPointId: string | null;
	markersShow: boolean;
	places: Record<string, Place>;
	placesShow: FirstShow;
	points: Record<string, Point>;
	range: number | null;
	rangeShow: boolean;
	ready: boolean;
	refreshing: boolean;
	routes: Record<string, Route>;
	routesShow: FirstShow;
	saved: boolean;
	selectedToExport: Record<'places' | 'routes', string[]>;
	serverConfig: any | null;
	stateBackups: any[];
	stateBackupsIndex: number;
	t: any;
	temps: Record<string, Point>;
	tempsShow: FirstShow;
	treeParams: Record<string, Tree>;
	user: User | null;
	users: Record<string, User>;
	zoom: number;
}

// SEC Types

export type Context =
	| 'folders'
	| 'points'
	| 'places'
	| 'routes'
	| 'images'
	| 'measure'
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
export type TreeItemType =
	| 'folder'
	| 'place'
	| 'route'
;
export type AppendMode =
	| 'change' // change the existing one
	| 'clone'  // create new based on the existing one
	| 'move'   // move the existing one to another object
	| 'new'    // create new
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

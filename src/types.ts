import 'axios';

declare module 'axios' {
	export interface AxiosRequestConfig {
		silent?: boolean;
	}
	export interface InternalAxiosRequestConfig {
		silent?: boolean;
	}
}

export type EntitiesContext =
	| 'folders'
	| 'points'
	| 'places'
	| 'routes'
	| 'images'
	| 'measure'
;
export type FolderContext =
	| 'places'
	| 'routes'
;
export type AppendMode =
	| 'change' // change the existing one
	| 'clone'  // create new based on the existing one
	| 'move'   // move the existing one to another object
	| 'new'    // create new
;
export type ImportExportFormat = 'json' | 'gpx';

// SEC Entities

export interface EntityCollection {
	folders?: Partial<Folder>[],
	points?: Partial<Point>[],
	places?: Partial<Place>[],
	routes?: Partial<Route>[],
	images?: Partial<Image>[],
}
export interface FirstShow {
	show: boolean,
	first: boolean,
}
export interface PointName {
	point?: Point,
	id?: string,
	name?: string,
	description?: string,
}
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
	geomarks: number;
	builded: boolean;
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
	geomark: boolean;
	images?: Record<string, Image>;
	home?: boolean;
}
export interface Route extends Entity {
	type: 'route';
	id: string;
	folderid: string;
	points: PointName[];
	choosing: number | null;
	name: string;
	description?: string;
	link?: string;
	time?: string;
	srt: number;
	geomarks: number;
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
export interface Measure {
	type: string;
	points: PointName[];
	choosing: number | null;
	show: boolean;
}
export interface DragPayload {
	id: string;
	type: string;
	context: string;
	before?: boolean;
}
export interface DragEntityPayload extends DragPayload {
	context: EntitiesContext;
	parentId?: string;
	index?: number;
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
export interface DragEventCustom extends DragEvent {
	dragBefore?: boolean;
}
export type DragHandler = (payload: DragPayload, target: HTMLElement) => void;

// SEC Store

export interface IMainState {
	activeMapIndex: number,
	backup: boolean,
	busyCount: number,
	center: Record<string, number>,
	centerPlacemarkShow: boolean,
	colortheme: string,
	commonPlacemarksShow: boolean,
	commonPlaces: Record<string, Place>,
	commonPlacesOnPageCount: number,
	commonPlacesPage: number,
	commonPlacesShow: boolean,
	commonRoutes: Record<string, Route>,
	commonRoutesOnPageCount: number,
	commonRoutesPage: number,
	commonRoutesShow: boolean,
	currentDrag: DragEntityPayload,
	currentPlace: Place | null,
	currentPoint: Point | null,
	currentRoute: Route | null,
	folders: Record<string, Folder>,
	homePlace: Place | null,
	idleTime: number,
	lang: string,
	langs: Record<string, string>[],
	measure: Measure,
	messages: string[],
	messagesMouseOver: boolean,
	messagesInterval: number | null,
	messagesTimeout: number | null,
	mode: string,
	newEntityPointId: string | null,
	placemarksShow: boolean,
	places: Record<string, Place>,
	placesShow: FirstShow,
	points: Record<string, Point>,
	range: number | null,
	rangeShow: boolean,
	ready: boolean,
	refreshing: boolean,
	routes: Record<string, Route>,
	routesShow: boolean,
	saved: boolean,
	serverConfig: any | null,
	stateBackups: any[],
	stateBackupsIndex: number,
	t: any,
	temps: Record<string, Point>,
	tempsPlacemarksShow: boolean,
	tempsShow: FirstShow,
	treeParams: Record<string, Tree>,
	user: User | null,
	users: Record<string, User>,
	zoom: number,
}

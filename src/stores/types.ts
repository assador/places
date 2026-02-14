export type AppendMode =
	| 'change' // change the existing one
	| 'clone'  // create new based on the existing one
	| 'move'   // move the existing one to another object
	| 'new'    // create new
;
export interface DataToDB {
	points?: Point[],
	places?: Place[],
	routes?: Route[],
	images?: Image[],
	images_delete?: Image[],
	images_update?: Image[],
	folders?: Folder[],
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
export interface Folder {
	type: string;
	context: string;
	virtual?: boolean;
	id: string;
	parent: string | null;
	userid: string;
	name: string;
	description?: string;
	srt: number;
	geomarks: number;
	builded: boolean;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	open: boolean;
	children?: Record<string, Folder>;
}
export interface Point {
	type: 'point';
	id: string;
	userid: string;
	latitude: number;
	longitude: number;
	altitude?: number | null;
	time?: string;
	common: boolean;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	show: boolean;
}
export interface Place {
	type: 'place';
	id: string;
	folderid: string;
	userid: string;
	pointid: string;
	name: string;
	description?: string;
	link?: string;
	time?: string;
	srt: number;
	common: boolean;
	geomark: boolean;
	images?: Record<string, Image>;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	show: boolean;
}
export interface Route {
	type: string;
	id: string;
	folderid: string;
	userid: string;
	points: PointName[];
	choosing: number | null;
	name: string;
	description?: string;
	link?: string;
	time?: string;
	srt: number;
	common: boolean;
	geomarks: number;
	images?: Record<string, Image>;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	show: boolean;
}
export interface Image {
	type: string;
	id: string;
	placeid: string;
	file: string;
	lastmodified: number;
	size: number;
	srt: number;
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
}
export interface DragEntityPayload extends DragPayload {
	context: 'folders' | 'points' | 'places' | 'routes' | 'images' | 'measure';
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
	context: 'images';
}

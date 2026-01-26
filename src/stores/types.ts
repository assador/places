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
	id: string,
	name: string,
}
export interface Point {
	type: string;
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
	type: string;
	id: string;
	userid: string;
	folderid: string;
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
	userid: string;
	folderid: string;
	points: PointName[];
	choosing: number | null;
	name: string;
	description?: string;
	link?: string;
	time?: string;
	srt: number;
	common: boolean;
	geomarks: number;
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
export interface Folder {
	id: string;
	parent: string | null;
	name: string;
	description?: string;
	srt: number;
	geomarks: number;
	builded: boolean;
	type: string;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	opened: boolean;
	userid: string;
	children?: Record<string, Folder>;
}
export interface User {
	id: string;
	login: string;
	password: string;
	name: string;
	email: string;
	phone: string;
	confirmed: boolean;
	confirmbefore: string;
	homeplace: string;
	testaccount: boolean;
	groups?: { group: string, parent: string }[];
	added?: boolean;
	deleted?: boolean;
	updated?: boolean;
	checked?: boolean;
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

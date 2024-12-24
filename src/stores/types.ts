export interface Waypoint {
	id: string;
	latitude: number;
	longitude: number;
	altitudecapability?: number | null;
	time?: string;
	common: boolean;
	type: string;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	show: boolean;
}
export interface Place {
	id: string;
	folderid: string;
	name: string;
	description?: string;
	waypoint: string;
	link?: string;
	time?: string;
	srt: number;
	common: boolean;
	geomark: boolean;
	userid: string;
	images?: Record<string, Image>;
	type: string;
	added: boolean;
	deleted: boolean;
	updated: boolean;
	show: boolean;
}
export interface Image {
	id: string;
	placeid: string;
	file: string;
	type: string;
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
	token: string;
	homeplace: string;
	testaccount: boolean;
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

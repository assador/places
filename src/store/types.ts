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
}
export interface State {
	refreshing: boolean;
	saved: boolean;
	idleTime: number;
	stateBackups?: Array<State>;
	stateBackupsIndex: number;
	inUndoRedo: boolean;
	user: User | null;
	currentPlace: Place | null;
	homePlace: Place | null;
	waypoints: Record<string, Waypoint>;
	places: Record<string, Place>;
	folders: Record<string, Folder>;
	commonPlaces: Record<string, Place>;
	center: {
		latitude: number;
		longitude: number;
	};
	zoom: number;
	placemarksShow: boolean;
	commonPlacemarksShow: boolean;
	centerPlacemarkShow: boolean;
	ready: boolean;
	messages: Array<string>;
	messageTimer: number;
	mouseOverMessages: boolean;
	serverConfig: Record<string, any> | null;
	lang: string;
	colortheme: string;
	t: any;
	tree: Folder;
}

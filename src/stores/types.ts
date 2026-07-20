import { Ref } from 'vue';
import { useGettersEntity } from '@/stores/getters/entity';
import { useGettersRelate } from '@/stores/getters/relate';
import { useGettersTree } from '@/stores/getters/tree';
import { useGettersOther } from '@/stores/getters/other';
import {
	Dictionary,
	DragEntityPayload,
	EntityCollection,
	FirstShow,
	Folder,
	GeomarksState,
	Image,
	ImageableEntity,
	Measure,
	Mode,
	Place,
	Point,
	PointDescription,
	PointInfo,
	Route,
	Tree,
	User,
} from '@/types';

export type EntityAppendMode =
	| 'change' // change the existing one
	| 'clone'  // create new based on the existing one
	| 'move'   // move the existing one to another object
	| 'new'    // create new
;
export type PointCoordinates = Pick<Point, 'latitude' | 'longitude' | 'altitude'>;
export type PlaceWithCoordinates = Place & Partial<PointCoordinates>;

export interface BaseUpsertParams<T> {
	object?: T;
	props?: Partial<T>;
	where?: Record<string, T>;
	mode?: EntityAppendMode;
	silent?: boolean;
}
export type UpsertPointParams = BaseUpsertParams<Point> & {
	whom?: Place | Route | Measure;
	name?: string;
	description?: string;
};
export type UpsertPlaceParams = BaseUpsertParams<PlaceWithCoordinates> & {
	center?: boolean;
};

export interface MainState {
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
	currentDrag: DragEntityPayload | null;
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
	offlineMode: boolean;
	online: boolean;
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
	t: Dictionary;
	temps: Record<string, Point>;
	tempsShow: FirstShow;
	treeParams: Record<string, Tree>;
	user: User | null;
	users: Record<string, Partial<User>>;
	zoom: number;
}

export type StoreMainStateRefs = {
	[K in keyof MainState]: Ref<MainState[K]>;
};

export type GettersEntity = ReturnType<typeof useGettersEntity>;
export type GettersOther = ReturnType<typeof useGettersOther>;
export type GettersRelate = ReturnType<typeof useGettersRelate>;
export type GettersTree = ReturnType<typeof useGettersTree>;

export interface StoreMainMethods {
	$resetToDefault: () => void;
};
export interface ActionsBackup {
	backupState: () => void;
	restoreState: (backupIndex: number) => void;
	replaceState: (payload: StoreMainStateRefs) => void;
	undo: () => void;
	redo: () => void;
	restoreObjectsAsLinks: () => void;
}
export interface ActionsDB {
	savedToDB: (payload: EntityCollection) => void;
	updateSavedStatus: () => void;
}
export interface ActionsEntity {
	setCurrentPoint: <T extends string | Point | null | undefined>(
		param: T,
		center?: boolean,
	) => void;
	setCurrentPlace: <T extends string | Place | null | undefined>(
		param: T,
		center?: boolean,
	) => void;
	setCurrentRoute: <T extends string | Route | null | undefined>(
		param: T,
		center?: boolean,
	) => void;
	setFirstCurrentPlace: () => void;
	setFirstCurrentRoute: () => void;
	setHomePlace: (p: { id: string | null, silent?: boolean }) => void;
	upsertPoint: (params?: UpsertPointParams) => Point | null;
	upsertPlace: (params?: UpsertPlaceParams) => Place | null;
	upsertPlaceFollowing: (
		entity: Place | null | undefined,
		params?: UpsertPlaceParams,
	) => Place | null;
	upsertPlaceFromPointInfo: (info: PointInfo | null) => Place | null;
	upsertRoute: (params?: BaseUpsertParams<Route>) => Route | null;
	upsertRouteFollowing: (
		entity: Route | null | undefined,
		params?: BaseUpsertParams<Route>,
	) => Route | null;
	upsertFolder: (params?: BaseUpsertParams<Folder>) => Folder | null;
	upsertEntityWithCurrentLocation: (mode: Mode) => Promise<
		{ id: string | null, of: Place | Route | Measure | null } | null
	>;
	upsertImage: (params: { image: Image; entity: ImageableEntity; }) => Image | null;
	deleteEntities: (objects: Record<string, Point | Place | Route | Folder>) => void;
	prepareFolderDelete: (folderId: string, mode: string) => Record<string, Place | Route | Folder>;
	deleteTemp: (id: string) => void;
	deleteAllTemps: () => void;
	deleteAllMeasurePoints: () => void;
	deleteImages: (p: { imageIds: string[], entity: Place | Route }) => void;
	changePoint: (p: { entity: Point, change: Partial<Point> }) => void;
	changePlace: (p: { entity: Place, change: Partial<Place> }) => void;
	changeRoute: (p: { entity: Route, change: Partial<Route> }) => void;
	changeFolder: (p: { entity: Folder, change: Partial<Folder> }) => void;
	changeRoutePoint: (p: { route: Route, index: number, change: Partial<PointDescription> }) => void;
	inspectOrphanPlaces: () => void;
	inspectOrphanRoutes: () => void;
	inspectOrphanFolders: () => void;
	resolveId: (
		oldId: string,
		idMap: Map<string, string>,
		entityRecord: Record<string, unknown>,
	) => string;
}
export interface ActionsImport {
	addImported: (p: { mime: string; text: string; }) => void;
	selectToExport: (type: 'places' | 'routes', id: string, checked: boolean) => void;
	toggleToExport: (type: 'places' | 'routes', id: string) => void;
}
export interface ActionsInit {
	reset: () => void;
	unload: () => void;
	setServerConfig: () => Promise<void>;
	setUsers: (payload?: string) => Promise<void>;
	setUser: () => Promise<void>;
	setEntities: () => Promise<void>;
}
export interface ActionsRelate {
	addPointToPoints: (p: {
			point: Point;
			entity: Route | Measure;
			index?: number;
			name?: string;
			description?: string;
		}
	) => void;
	removePointFromPoints: (
		{ index, entity }:
		{ index: number; entity: Route | Measure; }
	) => void;
}
export interface ActionsService {
	onServerOut: () => void;
	onServerOn: () => void;
	setOffline: (offlineMode?: boolean) => void;
	setPointAltitude: (entity: Point) => Promise<void>;
}
export interface ActionsUI {
	setBusy: (busy: boolean) => void;
	changeLang: (lang: string) => void;
	clearMessagesTiming: () => void;
	setMessage: (message: string, secondsForAll?: number, secondsForOne?: number) => void;
	deleteMessage: (index: number) => void;
	clearMessages: (polyubasu?: boolean) => void;
	folderOpenClose: (p: { folder: Folder; open?: boolean; }) => void;
	openTreeTo: (object: Place | Route) => void;
	openTreeToCurrent: (current: Place | Route | null) => void;
	centerMarkerShowHide: (show?: boolean) => void;
	markersShowHide: (show?: boolean) => void;
	commonMarkersShowHide: (show?: boolean) => void;
	commonRoutesShowHide: (show?: boolean) => void;
	showHideGeomarks: (p: { object: Folder | Place | Route, show: GeomarksState }) => void;
	showInRange: (range: number | null) => void;
	updateMap: (p: { latitude?: number; longitude?: number; zoom?: number; }) => void;
}

export type StoreMain =
	StoreMainStateRefs &
	StoreMainMethods &
	GettersEntity &
	GettersOther &
	GettersRelate &
	GettersTree &
	ActionsBackup &
	ActionsDB &
	ActionsEntity &
	ActionsImport &
	ActionsInit &
	ActionsRelate &
	ActionsService &
	ActionsUI
;

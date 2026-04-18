import { defineStore } from 'pinia';
import {
	IMainState,
	PointName,
	Entity,
	Point,
	Place,
	Route,
	Folder,
	EntityCollection,
	TreeItemType,
} from '@/types';
import { isFolder } from '@/guards';
import { constants } from '@/shared/constants';
import { distanceOnSphere } from '@/shared/common';
import { t } from '@/lang/ru';

import { entityActions } from './actions/entity';
import { relateActions } from './actions/relate';
import { importActions } from './actions/import';
import { backupActions } from './actions/backup';
import { initActions } from './actions/init';
import { dbActions } from './actions/db';
import { uiActions } from './actions/ui';
import { serviceActions } from './actions/service';

import { treeGetters } from './getters/tree';

export const useMainStore = defineStore('main', {
	state: (): IMainState => ({
		activeMapIndex: 0,
		backup: true,
		busyCount: 0,
		center: {
			latitude: Number(constants.map.initial.latitude),
			longitude: Number(constants.map.initial.longitude),
		},
		centerPlacemarkShow: true,
		colortheme: 'brown',
		commonPlacemarksShow: false,
		commonPlaces: {},
		commonPlacesOnPageCount: constants.commonplacesonpagecount,
		commonPlacesPage: 1,
		commonPlacesShow: false,
		commonRoutes: {},
		commonRoutesOnPageCount: constants.commonroutesonpagecount,
		commonRoutesPage: 1,
		commonRoutesShow: false,
		currentDrag: null,
		currentPlace: null,
		currentPoint: null,
		currentRoute: null,
		first: true,
		folders: {},
		idleTime: 0,
		lang: 'ru',
		langs: [{
			value: 'ru',
			title: 'Русский',
		}, {
			value: 'en',
			title: 'English',
		}],
		measure: {
			type: 'measure',
			points: [],
			choosing: null,
			show: false,
		},
		messages: [],
		messagesMouseOver: false,
		messagesInterval: null,
		messagesTimeout: null,
		mode: 'normal',
		newEntityPointId: null,
		placemarksShow: true,
		places: {},
		placesShow: { show: true, first: true },
		points: {},
		range: null,
		rangeShow: false,
		ready: false,
		refreshing: false,
		routes: {},
		routesShow: false,
		saved: true,
		serverConfig: null,
		stateBackups: [],
		stateBackupsIndex: -1,
		t: t,
		temps: {},
		tempsPlacemarksShow: true,
		tempsShow: { show: false, first: true },
		treeParams: {
			places: {
				context: 'places',
				open: false,
			},
			routes: {
				context: 'routes',
				open: false,
			},
		},
		user: null,
		users: {},
		zoom: Number(constants.map.initial.zoom),
	}),

	persist: true,

	actions: {
		...entityActions,
		...relateActions,
		...importActions,
		...backupActions,
		...initActions,
		...dbActions,
		...uiActions,
		...serviceActions,

		collectModified<T extends Entity>(collection: Record<string, T>): T[] {
			return Object.values(collection).filter(i =>
				(i.added || i.updated || i.deleted) && !(i.added && i.deleted)
			);
		},
		swapSrts(payload: any[]) {
			payload[0].srt = [ payload[1].srt, payload[1].srt = payload[0].srt ][0];
		},
	},

	getters: {
		...treeGetters,

		busy() {
			return this.busyCount > 0;
		},
		descriptionFields() {
			const descriptionFields = {
				name               : this.t.i.captions.name,
				description        : this.t.i.captions.description,
				link               : this.t.i.captions.link,
				latitude           : this.t.i.captions.latitude,
				longitude          : this.t.i.captions.longitude,
				coordsMinSec       : this.t.i.captions.coordsMinSec,
				altitudecapability : this.t.i.captions.altitudecapability,
				range              : this.t.i.captions.range,
				time               : this.t.i.captions.time,
				srt                : this.t.i.captions.srt,
				common             : this.t.i.captions.common,
				images             : this.t.i.captions.images,
				point              : this.t.i.captions.point,
				home               : this.t.i.inputs.checkboxHome,
			}
			return descriptionFields;
		},
		distanceBetweenPoints() {
			return (ids: string[], where?: string): number => {
				if (ids.length < 2) return 0;
				const points = where ? this[where] : this.getAllPoints;
				let distance = 0;
				for (let i = 1; i < ids.length; i++) {
					if (!points[ids[i]]) continue;
					distance += distanceOnSphere(
						points[ids[i]].latitude,
						points[ids[i]].longitude,
						points[ids[i - 1]].latitude,
						points[ids[i - 1]].longitude,
						constants.earthRadius
					);
				}
				return distance;
			}
		},
		getAllPoints() {
			return { ...this.points, ...this.temps };
		},
		getPointById() {
			return (id: string) => {
				if (Object.hasOwn(this.points, id)) return this.points[id];
				if (Object.hasOwn(this.temps, id)) return this.temps[id];
				return null;
			}
		},
		getPlaceById() {
			return (id: string) => {
				if (Object.hasOwn(this.places, id)) return this.places[id];
				if (Object.hasOwn(this.commonPlaces, id)) return this.commonPlaces[id];
				return null;
			}
		},
		getRouteById() {
			return (id: string) => {
				if (Object.hasOwn(this.routes, id)) return this.routes[id];
				if (Object.hasOwn(this.commonRoutes, id)) return this.commonRoutes[id];
				return null;
			}
		},
		getNeighboursSrts() {
			return (id: string, type: TreeItemType, top?: boolean) => {
				const collection: Record<string, Folder | Place | Route> = this[type + 's'];
				const item = collection[id];
				if (!item) return null;
				const parentId = isFolder(item) ? item.parent : item.folderid;
				const neighboursSrts: number[] = [];
				for (const key in collection) {
					const i = collection[key];
					const iParentId = isFolder(i) ? i.parent : i.folderid;
					if (iParentId === parentId) neighboursSrts.push(i.srt);
				}
				neighboursSrts.sort((a, b) => a - b);
				const currentIndex = neighboursSrts.indexOf(item.srt);
				const previous = neighboursSrts[currentIndex - 1];
				const next = neighboursSrts[currentIndex + 1];
				let newSrt: number;
				if (top) {
					newSrt = !previous
						? item.srt / 2
						: (item.srt - previous) / 2 + previous;
				} else {
					newSrt = !next ? item.srt + 1 : (next - item.srt) / 2 + item.srt;
				}
				return {
					all: neighboursSrts,
					own: item.srt,
					previous,
					next,
					new: newSrt,
				};
			}
		},
		getSharedPointIds(): string[] {
			const counts = new Map<string, number>();
			const count = (id: string) => counts.set(id, (counts.get(id) || 0) + 1);

			Object.values<Place>(this.places).forEach(place => count(place.pointid));

			Object.values<Route>(this.routes).forEach(route => {
				route.points.forEach(p => {
					const actualId = this.places[p.id]?.pointid || p.id;
					count(actualId);
				});
			});

			const shared: string[] = [];
			for (const [id, num] of counts) {
				if (num > 1) shared.push(id);
			}
			return shared;
		},
		homePlace(): Place | null {
			return this.places[this.user?.homeplace] ?? null;
		},
		measureTemps() {
			return Object.values(this.temps).filter(
				(point: Point) => point.type === 'point'
			);
		},
		measurePointIds() {
			return new Set(this.measure.points.map((p: PointName) => {
				if (p.id) return p.id;
				else if (p.point) return this.getPointById(p.point.id);
			}));
		},
		routePointIds: () => {
			return (route: Route) => new Set(route.points.map((p: PointName) => p.id));
		},
		tempIndexById: state => {
			return (id: string) => Object.keys(state.temps).indexOf(id);
		},
		routePoints() {
			return (route: Route): Point[] => {
				if (route === null) return [];
				const points: Point[] = [];
				for (const p of route.points) {
					if (p.id in this.points) points.push(this.points[p.id]);
						else if (p.id in this.temps) points.push(this.temps[p.id]);
				}
				return points;
			}
		},
		// Since the route points can be either its own or temporary
		// or points of other places, we collect them all in one array
		routeAllPointsArray() {
			return (route: Route): { point: Point, of: string }[] => {
				const points: { point: Point, of: string }[] = [];
				let of: string;
				for (const p of route.points) {
					if (p.id in this.temps) of = 'temps';
					else if (
						Object.values(this.places).map((p: Place) => p.pointid)
							.includes(p.id)
					) {
						of = 'places';
					}
					points.push({
						point: this.points[p.id],
						of: of,
					});
				}
				return points;
			}
		},
		getPointCoords() {
			return (pointId: string): number[] => {
				const point = this.getPointById(pointId);
				return [ point.latitude, point.longitude ];
			}
		},
		getPointsCoords() {
			return (pointIdsArray: string[]): number[][] => {
				const coords: number[][] = [];
				let point: Point;
				for (const id of pointIdsArray) {
					point = this.getPointById(id);
					coords.push([ point.latitude, point.longitude ]);
				}
				return coords;
			}
		},
		pointReferences() {
			const refs = new Map<string, Set<string>>();
			Object.values(this.places).forEach((place: Place) => {
				if (!place.deleted) {
					if (!refs.has(place.pointid)) refs.set(place.pointid, new Set());
					refs.get(place.pointid).add(place.id);
				}
			});
			Object.values(this.routes).forEach((route: Route) => {
				if (!route.deleted) {
					route.points.forEach(p => {
						const pid = this.places[p.id]?.pointid || p.id;
						if (!refs.has(pid)) refs.set(pid, new Set());
						refs.get(pid).add(route.id);
					});
				}
			});
			return refs;
		},
		getAllModifiedPackage(): EntityCollection {
			return {
				points: this.collectModified(this.points),
				places: this.collectModified(this.places),
				routes: this.collectModified(this.routes),
				folders: this.collectModified(this.folders),
			};
		},
		getDistance() {
			return (
				pointIds: string[] = this.measure.points.map((p: PointName) => p.id),
				takeIntoAltitudeDeltas: boolean = false,
			): number => {
				if (pointIds.length < 2) return 0;
				let distance = 0;
				for (let i = 0; i < pointIds.length - 1; i++) {
					const p1 = this.getPointById(pointIds[i]);
					const p2 = this.getPointById(pointIds[i + 1]);
					if (p1 && p2) {
						const d = distanceOnSphere(
							p1.latitude, p1.longitude,
							p2.latitude, p2.longitude,
							constants.earthRadius
						);
						if (
							takeIntoAltitudeDeltas &&
							p1.altitude !== null &&
							p2.altitude !== null
						) {
							const deltaH = Math.abs(p1.altitude - p2.altitude) / 1000;
							distance += Math.sqrt(Math.pow(d, 2) + Math.pow(deltaH, 2));
						} else {
							distance += d;
						}
					}
				}
				return distance;
			}
		},
	},
});

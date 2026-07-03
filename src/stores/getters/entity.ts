import {
	Entity,
	Point,
	Place,
	Route,
	RawImage,
	EntityCollection,
	PointDescription,
	FatPointDescription,
	FatPointsPack,
} from '@/types';

export const entityGetters = {

// ID Set Getters

	pointDescriptionIds() {
		return (points: PointDescription[]): Set<string> => {
			const set = new Set<string>();
			points.forEach(pd => set.add(pd.id));
			return set;
		}
	},
	measurePointIds(): Set<string> {
		const set = new Set<string>();
		this.measure.points.forEach((pd: PointDescription) => set.add(pd.id));
		return set;
	},
	notMeasureTempPointIds(): Set<string> {
		const set = new Set<string>();
		for (const id in this.temps) if (!this.measurePointIds.has(id)) set.add(id);
		return set;
	},

// Entity Getters

	homePlace(): Place | null {
		const homeplaceId = this.user?.homeplace;
		return homeplaceId ? (this.places[homeplaceId] ?? null) : null;
	},
	currentPoint(): Point | null {
		return this.currentPointId
			? (this.points[this.currentPointId] ?? this.temps[this.currentPointId] ?? null)
			: null;
	},
	currentPlace(): Place | null {
		return this.currentPlaceId ? (this.places[this.currentPlaceId] ?? null) : null;
	},
	currentRoute(): Route | null {
		return this.currentRouteId ? (this.routes[this.currentRouteId] ?? null) : null;
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
	collectModified() {
		return <T extends Entity>(c: Record<string, T>): T[] => {
			const modified: T[] = [];
			for (const id in c) {
				if (
					(c[id].added || c[id].updated || c[id].deleted) &&
					!(c[id].added && c[id].deleted)
				) {
					modified.push(c[id]);
				}
			}
			return modified;
		}
	},
	getPendingImagesPackage(): RawImage[] {
		const pending: RawImage[] = [];
		this.collectModified(this.places).forEach((place: Place) => {
			if (place.images) {
				for (const id in place.images) {
					if (place.images[id].new && place.images[id].raw) {
						pending.push({
							id: id,
							raw: place.images[id].raw,
							entityid: place.id,
							entitytype: 'place',
						});
					}
				}
			}
		});
		this.collectModified(this.routes).forEach((route: Route) => {
			if (route.images) {
				for (const id in route.images) {
					if (route.images[id].new && route.images[id].raw) {
						pending.push({
							id: id,
							raw: route.images[id].raw,
							entityid: route.id,
							entitytype: 'route',
						});
					}
				}
			}
		});
		return pending;
	},
	getAllModifiedPackage(): EntityCollection {
		return {
			points: this.collectModified(this.points),
			places: this.collectModified(this.places),
			routes: this.collectModified(this.routes),
			folders: this.collectModified(this.folders),
		};
	},

// Temp Getters

	measureFatPoints(): FatPointDescription[] {
		return this.measure.points.map((p: PointDescription, index: number) => {
			return {
				...p,
				name: p.name ?? String(index + 1),
				index: index,
				key: `measure-${p.id}`,
				point: this.temps[p.id] || this.points[p.id],
			};
		});
	},
	notMeasureFatTemps(): FatPointsPack {
		const points: FatPointDescription[] = [];
		let index = 0;
		for (const id of this.notMeasureTempPointIds) {
			points.push({
				id: id,
				name: String(index + 1),
				index: index,
				key: `temp-${id}`,
				point: this.temps[id],
			});
			index++;
		}
		return {
			id: 'tempspack',
			type: 'pointspack',
			points: points,
			choosing: points.find(p => p.point.id === this.currentPointId)?.index ?? null,
			show: false,
			name: this.t.i.captions.pointsTemporary,
		};
	},
};

import {
	Point,
	Place,
	Route,
	Measure,
	PointDescription,
	FatPointDescription,
	EntityCollection,
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
		return this.places[this.user?.homeplace] ?? null;
	},
	currentPoint() {
		return (this.points[this.currentPointId] ?? this.temps[this.currentPointId]);
	},
	currentPlace() {
		return this.places[this.currentPlaceId];
	},
	currentRoute() {
		return this.routes[this.currentRouteId];
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
				key: `${p.id}-${index}`,
				point: this.temps[p.id],
			};
		});
	},
	notMeasureFatTemps(): Measure<FatPointDescription> {
		const points: FatPointDescription[] = [];
		let index = 0;
		for (const id of this.notMeasureTempPointIds) {
			points.push({
				id: id,
				name: String(index + 1),
				index: index,
				key: `${id}-${index}`,
				point: this.temps[id],
			});
			index++;
		}
		return {
			type: 'temps',
			points: points,
			choosing: points.find(p => p.id === this.currentPointId)?.index ?? null,
			show: false,
			name: this.t.i.captions.pointsTemporary,
		};
	},
};

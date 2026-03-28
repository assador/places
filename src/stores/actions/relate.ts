import {
	Point,
	Place,
	Route,
	Measure,
} from '@/types';

export const relateActions = {
	addPointToPoints({
		point = this.currentPoint,
		entity,
		index,
	}: {
		point: Point;
		entity?: Route | Measure;
		index?: number;
	}) {
		if (!entity) {
			if (this.mode === 'routes' && this.currentRoute) {
				entity = this.currentRoute;
			} else if (this.mode === 'measure') {
				entity = this.measure;
			} else {
				return;
			}
		}
		if (!index) index = entity.points.length;

		const numbers = entity.points
			.filter(p => /^\d+$/.test(p.name))
			.map(p => Number(p.name));
		const name = (Math.max(0, ...numbers) + 1).toString();

		entity.points.splice(index, 0, {
			id: point.id,
			name: name,
		});
		// In routes mode, add the Point to the points dict
		// if it is not already there (for example, if the Point is temp)
		// and update the current route:
		if (this.mode === 'routes' && !Object.hasOwn(this.points, point.id)) {
			this.points[point.id] = point;
			if (Object.hasOwn(this.temps, point.id)) delete this.temps[point.id];
			this.points[point.id].added = true;
			(entity as Route).updated = true;
		}
	},
	removePointFromPoints({
		point = this.currentPoint,
		entity,
	}: {
		point: Point;
		entity?: Route | Measure;
	}) {
		if (!entity) {
			if (this.mode === 'routes' && this.currentRoute) {
				entity = this.currentRoute;
			} else if (this.mode === 'measure') {
				entity = this.measure;
			} else {
				return;
			}
		}
		const idx = entity.points.map(p => p.id).indexOf(point.id);
		if (idx === -1) return;
		entity.points.splice(idx, 1);
		if (entity.choosing > entity.points.length - 1) {
			entity.choosing = entity.points.length - 1;
		}
	},
	removeRoutePoint({
		point = this.currentPoint,
		route = this.currentRoute,
	}: {
		point: Point;
		route: Route;
	}) {
		let idx = null;
		for (let i = 0; i < route.points.length; i++) {
			if (route.points[i].id === point.id) {
				idx = i;
				break;
			}
		}
		if (idx === null) return;
		route.points.splice(idx, 1);
		this.backupState();
	},
	wherePointIsUsed(id: string) {
		const uses: (Place | Route)[] = [];
		uses.push(
			...(Object.values(this.places) as Place[]).filter(place =>
				place.pointid === id
			),
			...(Object.values(this.routes) as Route[]).filter(route =>
				route.points.find(p => p.id === id)
			),
		);
		return uses;
	},
	getEntitiesReferencingPoint(pointId: string): Record<string, Place | Route> {
		const entities: Record<string, Place | Route> = {};
		Object.values<Place>(this.places).forEach(p => {
			if (p.pointid === pointId) entities[p.id] = p;
		});
		Object.values<Route>(this.routes).forEach(r => {
			if (r.points.some(p => p.id === pointId)) entities[r.id] = r;
		});
		return entities;
	},
};

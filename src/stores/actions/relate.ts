import { Point, Route, Measure } from '@/types';
import { isRoute } from '@/guards';

export const relateActions = {
	addPointToPoints(
		{ point, entity, index, name, description }:
		{
			point: Point;
			entity: Route | Measure;
			index?: number;
			name?: string;
			description?: string;
		}
	) {
		if (typeof index === 'undefined') index = entity.points.length;
		if (!description) description = '';
		if (!name) {
			const numbers = entity.points
				.filter(p => p.name && /^\d+$/.test(p.name))
				.map(p => Number(p.name))
			;
			name = (Math.max(0, ...numbers) + 1).toString();
		}
		entity.points.splice(index, 0, {
			id: point.id,
			name: name,
			description: description,
		});
		if (isRoute(entity) && !Object.hasOwn(this.points, point.id)) {
			this.points[point.id] = point;
			if (Object.hasOwn(this.temps, point.id)) delete this.temps[point.id];
			this.points[point.id].added = true;
			(entity as Route).updated = true;
		}
		this.saved = false;
		this.backupState();
	},
	removePointFromPoints(
		{ index, entity }:
		{ index: number; entity: Route | Measure; }
	) {
		const pointId = entity.points.at(index)?.id;
		if (!pointId) return;
		entity.points.splice(index, 1);
		if (entity.choosing > entity.points.length - 1) {
			entity.choosing = entity.points.length - 1;
		}
		if ('updated' in entity) entity.updated = true;
		if (Object.hasOwn(this.points, pointId)) {
			const refs = this.pointReferences;
			if ((refs.get(pointId)?.size || 0) === 0) {
				this.deleteEntities({ [pointId]: this.points[pointId] });
				return;
			}
		} else if (
			Object.hasOwn(this.temps, pointId) &&
			!entity.points.some(pd => pd.id === pointId)
		) {
			delete this.temps[pointId];
		}
		this.saved = false;
		this.backupState();
	},
};

import { StoreMain, ActionsRelate } from '@/stores/types';
import { Point, Route, Measure } from '@/types';
import { isRoute } from '@/guards';

export function useActionsRelate(
	store: StoreMain,
): ActionsRelate {

	const addPointToPoints = (
		{ point, entity, index, name, description }:
		{
			point: Point;
			entity: Route | Measure;
			index?: number;
			name?: string;
			description?: string;
		}
	): void => {
		if (index === undefined) index = entity.points.length;
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
		if (isRoute(entity) && !Object.hasOwn(store.points.value, point.id)) {
			store.points.value[point.id] = point;
			if (Object.hasOwn(store.temps.value, point.id)) delete store.temps.value[point.id];
			store.points.value[point.id].added = true;
			entity.updated = true;
			store.saved.value = false;
		}
		store.backupState();
	};
	const removePointFromPoints = (
		{ index, entity }:
		{ index: number; entity: Route | Measure; }
	): void => {
		const pointId = entity.points.at(index)?.id;
		if (!pointId) return;
		entity.points.splice(index, 1);
		if (isRoute(entity)) entity.updated = true;
		if (Object.hasOwn(store.points.value, pointId)) {
			const refs = store.pointReferences.value;
			if ((refs.get(pointId)?.size || 0) === 0) {
				store.deleteEntities({ [pointId]: store.points.value[pointId] });
			}
		} else if (
			Object.hasOwn(store.temps.value, pointId) &&
			!entity.points.some(pd => pd.id === pointId)
		) {
			delete store.temps.value[pointId];
		}
		store.backupState();
	};

	return {
		addPointToPoints,
		removePointFromPoints,
	};
};

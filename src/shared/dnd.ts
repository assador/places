import {
	Place,
	Route,
	DragPointInListPayload,
	DragFolderPayload,
	DragPlacePayload,
	DragRoutePayload,
	DragImagePayload,
} from '@/stores/types';
import { isAncestorOf, moveInArray, moveInObject } from '@/shared';
import { useMainStore } from '@/stores/main';

export const handleFolderDropped = (
	payload: DragFolderPayload,
	target: HTMLElement,
) => {
	const mainStore = useMainStore();
	const targetId = target.dataset.entityId === 'null'
		? null : target.dataset.entityId
	;
	if (
		targetId === payload.id ||
		target.dataset.entityType !== 'folder' ||
		isAncestorOf({
			ancestorId: payload.id,
			descendantId: targetId,
			relativesList: mainStore.folders,
		})
	) {
		return;
	}
	const folder = mainStore.folders[payload.id];
	const neighbours = Object.values(mainStore.folders).filter(
		f => f.parent === targetId
	);
	let srt = 10, parentId = targetId;

	switch (target.dataset.entitySortArea) {
		case 'top':
		case 'bottom':
			srt = mainStore.getNeighboursSrts(
				targetId,
				target.dataset.entityType,
				target.dataset.entitySortArea === 'top' ? true : false,
			).new;
			parentId = mainStore.folders[targetId]?.parent ?? null;
			break;
		default:
			srt = Math.max(0, ...neighbours.map(f => f.srt)) + 10;
			break;
	}
	mainStore.changeFolder({
		folder: folder,
		change: {
			srt: srt,
			parent: parentId,
		},
	});
	folder.updated = true;
	mainStore.backupState();
};
export const handlePlaceRouteDropped = (
	payload: DragPlacePayload | DragRoutePayload,
	target: HTMLElement,
) => {
	const mainStore = useMainStore();
	const targetId = target.dataset.entityId === 'null'
		? null : target.dataset.entityId
	;
	if (
		targetId === payload.id ||
		![target.dataset.entityType, 'folder'].includes(target.dataset.entityType)
	) {
		return;
	}
	let parentId = (target.dataset.entityType !== 'folder'
		? mainStore[payload.context][targetId].folderid
		: (target.dataset.entitySortArea
			? mainStore.folders[targetId]?.parent ?? null
			: targetId
	));
	let srt = 10;
	const entity = mainStore[payload.context][payload.id];
	const neighbours = Object.values<Place | Route>(mainStore[payload.context])
		.filter(f => f.folderid === parentId)
	;
	switch (target.dataset.entitySortArea) {
		case 'top':
		case 'bottom':
			srt = mainStore.getNeighboursSrts(
				targetId,
				target.dataset.entityType,
				target.dataset.entitySortArea === 'top' ? true : false,
			).new;
			break;
		default:
			srt = Math.max(0, ...neighbours.map(f => f.srt)) + 10;
			break;
	}
	let changeFunc = (
		{}: { entity: Place | Route; change: Partial<Place | Route>; }
	) => {
		return;
	};
	if (payload.context === 'places') changeFunc = mainStore.changePlace;
	if (payload.context === 'routes') changeFunc = mainStore.changeRoute;
	changeFunc({
		entity: entity,
		change: {
			srt: srt,
			folderid: parentId,
		},
	});
	entity.updated = true;
	mainStore.backupState();
};
export const handlePointInListDropped = (
	payload: DragPointInListPayload,
	target: HTMLElement,
) => {
	const mainStore = useMainStore();
	const targetIndex = Number(target.dataset.entityIndex);
	if (
		payload.index === targetIndex ||
		payload.context !== target.dataset.entityContext ||
		payload.context === 'routes' && typeof payload.parentId !== 'string'
	) {
		return;
	}
	let parent = undefined;
	if (payload.context === 'measure') parent = mainStore.measure;
	if (payload.context === 'routes') parent = mainStore.routes[payload.parentId];
	if (!parent) return;
	moveInArray(parent.points, payload.index, targetIndex, payload.before);
	if (payload.context === 'routes') {
		parent.updated = true;
	}
	mainStore.backupState();
};
export const handleImageDropped = (
	payload: DragImagePayload,
	target: HTMLElement,
) => {
	const mainStore = useMainStore();
	const targetId = target.dataset.entityId;
	if (
		targetId === payload.id ||
		payload.context !== target.dataset.entityContext ||
		typeof payload.parentId !== 'string'
	) {
		return;
	}
	let parent = undefined;
	if (payload.context === 'places') parent = mainStore.places[payload.parentId];
	if (payload.context === 'routes') parent = mainStore.routes[payload.parentId];
	if (!parent) return;
	moveInObject(
		parent.images,
		parent.images[payload.id],
		parent.images[targetId],
		'srt',
		payload.before,
	);
	parent.updated = true;
	mainStore.backupState();
};

import {
	Place,
	Route,
	Measure,
	DragHandler,
	DragPointInListPayload,
	DragFolderPayload,
	DragPlacePayload,
	DragRoutePayload,
	DragImagePayload,
	TreeItemType,
} from '@/types';
import { isAncestorOf } from '@/shared/checkers';
import { moveInArray, moveInObject } from '@/shared/sorting';
import { useMainStore } from '@/stores/main';

export const handleFolderDropped: DragHandler = (
	payload: DragFolderPayload,
	target,
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
	let srt: number, parentId = targetId;

	switch (payload.position) {
		case 'before':
		case 'after':
			srt = mainStore.getNeighboursSrts(
				targetId,
				target.dataset.entityType,
				payload.position === 'before',
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
};
export const handlePlaceRouteDropped: DragHandler = (
	payload: DragPlacePayload | DragRoutePayload,
	target,
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
	const parentId = (target.dataset.entityType !== 'folder'
		? mainStore[payload.context][targetId].folderid
		: (target.dataset.entitySortArea
			? mainStore.folders[targetId]?.parent ?? null
			: targetId
	));
	let srt: number;
	const entity = mainStore[payload.context][payload.id];
	const neighbours = Object.values<Place | Route>(mainStore[payload.context])
		.filter(f => f.folderid === parentId)
	;
	switch (payload.position) {
		case 'before':
		case 'after':
			srt = mainStore.getNeighboursSrts(
				targetId,
				target.dataset.entityType as TreeItemType,
				payload.position === 'before',
			).new;
			break;
		default:
			srt = Math.max(0, ...neighbours.map(f => f.srt)) + 10;
			break;
	}
	type ChangePayload = { entity: Place | Route; change: Partial<Place | Route> };
	let changeFunc: (p: ChangePayload) => void = () => {};
	if (payload.context === 'places') changeFunc = mainStore.changePlace;
	if (payload.context === 'routes') changeFunc = mainStore.changeRoute;
	changeFunc({
		entity: entity,
		change: {
			srt: srt,
			folderid: parentId,
		},
	});
};
export const handlePointInListDropped: DragHandler = (
	payload: DragPointInListPayload,
	target,
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
	let parent: Route | Measure = undefined;
	if (payload.context === 'measure') parent = mainStore.measure;
	if (payload.context === 'routes') parent = mainStore.routes[payload.parentId];
	if (!parent) return;
	moveInArray(
		parent.points,
		payload.index,
		targetIndex,
		payload.position === 'before',
	);
	if (payload.context === 'routes') {
		(parent as Route).updated = true;
	}
	mainStore.backupState();
};
export const handleImageDropped: DragHandler = (
	payload: DragImagePayload,
	target,
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
		payload.id,
		targetId,
		'srt',
		payload.position === 'before',
	);
	parent.updated = true;
	mainStore.saved = false;
	mainStore.backupState();
};

// SEC UI

export const usePointerDnD = (config: {
	canAcceptDrop: (target: HTMLElement) => boolean,
	handleDrop: (target: HTMLElement) => void,
	updateHighlights?: (target: HTMLElement | null) => void,
	onDragStateChange?: (isDragging: boolean) => void,
	threshold?: number,
}) => {
	const mainStore = useMainStore();
	const threshold = config.threshold ?? 7;
    let start = { x: 0, y: 0 };
    let offset = { x: 0, y: 0 };
    let ghostEl: HTMLElement | null = null;

	const onPointerDown = (event: PointerEvent, payload: any) => {
		if (event.buttons !== 1 || event.ctrlKey || event.metaKey) return;
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		el.setPointerCapture(event.pointerId);
		start = { x: event.clientX, y: event.clientY };
		offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		mainStore.currentDrag = {
			...payload,
			dragging: false,
			startTime: Date.now(),
		};
	};
	const onPointerMove = (event: PointerEvent) => {
		const payload = mainStore.currentDrag;
		if (!payload) return;
		if (!payload.dragging) {
			const duration = Date.now() - (payload?.startTime ?? Date.now());
			if (duration > 500) {
				mainStore.currentDrag = null;
				return;
			}
			const dist = Math.hypot(event.clientX - start.x, event.clientY - start.y);
			if (dist < threshold) return;
			payload.dragging = true;
			config.onDragStateChange?.(true);

			const originalEl = event.currentTarget as HTMLElement;
			const targetToClone = payload.ghostSelector
				? originalEl.querySelector(payload.ghostSelector)
				: originalEl
			;
			ghostEl = (targetToClone || originalEl).cloneNode(true) as HTMLElement;
			ghostEl.removeAttribute('id');
			ghostEl.className = 'drag-clone';
			Object.assign(ghostEl.style, {
				width: `${(targetToClone as HTMLElement).offsetWidth}px`,
				height: `${(targetToClone as HTMLElement).offsetHeight}px`,
			});
			document.getElementById('container')?.appendChild(ghostEl);
		}
		if (ghostEl) {
			ghostEl.style.transform = `translate3d(
				${event.clientX - offset.x}px,
				${event.clientY - offset.y}px,
			0)`;
		}
		const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
		config.updateHighlights?.(target);
	};
	const onPointerUp = (event: PointerEvent, click?: () => void) => {
		if (event.button !== 0) return;
		const payload = mainStore.currentDrag;
		const duration = Date.now() - (payload?.startTime ?? Date.now());
	 	if (payload?.dragging) {
			const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
			const dropTarget = el?.closest('[data-entity-id]') as HTMLElement;
			if (dropTarget && config.canAcceptDrop(dropTarget)) {
				config.handleDrop(dropTarget);
			}
		} else if (payload && duration <= 500) {
			click?.();
		}
		mainStore.currentDrag = null;
		config.onDragStateChange?.(false);
		config.updateHighlights?.(null);
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		if (ghostEl) {
			ghostEl.remove();
			ghostEl = null;
		}
	};
	return { onPointerDown, onPointerMove, onPointerUp };
};

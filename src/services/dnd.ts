import {
	DragEntityPayload,
	DragFolderPayload,
	DragImagePayload,
	DragPlacePayload,
	DragPointInListPayload,
	DragRoutePayload,
	Place,
	Route,
	Measure,
} from '@/types';
import { isTreeItemType } from '@/guards';
import { isAncestorOf } from '@/shared/checkers';
import { moveInArray, moveInObject } from '@/shared/sorting';
import { useMainStore } from '@/stores/main';

export const handleFolderDropped = (
	payload: DragFolderPayload,
	target: HTMLElement,
): void => {
	const mainStore = useMainStore();
	const targetId = target.dataset.entityId === 'null'
		? null : target.dataset.entityId
	;
	if (
		!targetId ||
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
	let parentId: string | null = targetId;
	let srt: number;
	const srts = mainStore.getSrts(targetId, target.dataset.entityType);

	switch (payload.position) {
		case 'before':
		case 'after':
			srt = srts ? (payload.position === 'before' ? srts.before : srts.after) : 10;
			parentId = targetId ? (mainStore.folders[targetId]?.parent ?? null) : null;
			break;
		default:
			srt = srts ? srts.max + 10 : 10;
			break;
	}
	mainStore.changeFolder({
		entity: folder,
		change: {
			srt: srt,
			parent: parentId,
		},
	});
};
export const handlePlaceRouteDropped = (
	payload: DragPlacePayload | DragRoutePayload,
	target: HTMLElement,
): void => {
	const mainStore = useMainStore();
	const targetId = target.dataset.entityId === 'null'
		? null : target.dataset.entityId
	;
	if (
		!targetId ||
		targetId === payload.id ||
		!isTreeItemType(target.dataset.entityType)
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
	const srts = mainStore.getSrts(targetId, target.dataset.entityType);

	switch (payload.position) {
		case 'before':
		case 'after':
			srt = srts ? (payload.position === 'before' ? srts.before : srts.after) : 10;
			break;
		default:
			srt = srts ? srts.max + 10 : 10;
			break;
	}
	if (payload.context === 'places') mainStore.changePlace({
		entity: entity as Place,
		change: {
			srt: srt,
			folderid: parentId,
		},
	});
	if (payload.context === 'routes') mainStore.changeRoute({
		entity: entity as Route,
		change: {
			srt: srt,
			folderid: parentId,
		},
	});
};
export const handlePointInListDropped = (
	payload: DragPointInListPayload,
	target: HTMLElement,
): void => {
	const mainStore = useMainStore();
	const targetIndex = Number(target.dataset.entityIndex);
	if (
		payload.parentId === undefined ||
		payload.index === targetIndex ||
		payload.context !== target.dataset.entityContext ||
		payload.context === 'routes' && typeof payload.parentId !== 'string'
	) {
		return;
	}
	let parent: Route | Measure | undefined = undefined;
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
export const handleImageDropped = (
	payload: DragImagePayload,
	target: HTMLElement,
): void => {
	const mainStore = useMainStore();
	const targetId = target.dataset.entityId;
	if (
		!targetId ||
		payload.parentId === undefined ||
		targetId === payload.id ||
		payload.context !== target.dataset.entityContext ||
		typeof payload.parentId !== 'string'
	) {
		return;
	}
	let parent = undefined;
	if (payload.context === 'places') parent = mainStore.places[payload.parentId];
	if (payload.context === 'routes') parent = mainStore.routes[payload.parentId];
	if (!parent || !parent.images) return;
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

	const onPointerDown = (event: PointerEvent, payload: DragEntityPayload) => {
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
		if (!payload || payload.nondraggable) return;
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

export const useLightPointerDnD = (config: {
	onDrag: (move: { x: number, y: number, deltaX: number, deltaY: number }) => void,
	onDragStart?: () => void,
	onDragEnd?: () => void,
}) => {
	let isDragging = false;
	let lastPos = { x: 0, y: 0 };

	const onPointerDown = (event: PointerEvent) => {
		if (event.buttons !== 1 || event.ctrlKey || event.metaKey) return;
		const el = event.currentTarget as HTMLElement;
		el.setPointerCapture(event.pointerId);
		isDragging = true;
		lastPos = { x: event.clientX, y: event.clientY };
		config.onDragStart?.();
	};
	const onPointerMove = (event: PointerEvent) => {
		if (!isDragging) return;
		const deltaX = event.clientX - lastPos.x;
		const deltaY = event.clientY - lastPos.y;
		lastPos = { x: event.clientX, y: event.clientY };
		config.onDrag({
			x: event.clientX,
			y: event.clientY,
			deltaX,
			deltaY,
		});
	};
	const onPointerUp = (event: PointerEvent) => {
		if (!isDragging) return;
		isDragging = false;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		config.onDragEnd?.();
	};
	return { onPointerDown, onPointerMove, onPointerUp };
};

export const handleDrop = (target: HTMLElement) => {
	const mainStore = useMainStore();
	const payload = mainStore.currentDrag;
	if (!payload) return;
	switch (payload.type) {
		case 'folder':
			handleFolderDropped(payload as DragFolderPayload, target);
			break;
		case 'place':
		case 'route':
			handlePlaceRouteDropped(payload as DragPlacePayload | DragRoutePayload, target);
			break;
		case 'point':
			handlePointInListDropped(payload as DragPointInListPayload, target);
			break;
		case 'image':
			handleImageDropped(payload as DragImagePayload, target);
			break;
	}
	mainStore.currentDrag = null;
};

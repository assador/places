import {
	DragEntityPayload,
	DragFolderPayload,
	DragImagePayload,
	DragPlacePayload,
	DragPointInListPayload,
	DragRoutePayload,
	DragSettingPayload,
	Place,
	Route,
	Measure,
} from '@/types';
import { Setting } from '@/types/settings';
import { isTreeItemType } from '@/guards';
import { isAncestorOf } from '@/shared/checkers';
import { moveInArray, moveInObject } from '@/shared/sorting';
import { useMainStore } from '@/stores/main';

// SEC Store dependencies

type MainStore = ReturnType<typeof useMainStore>;

type DnDStoreOverrides = Partial<Pick<
	MainStore,
	| 'treeParams'
	| 'getSrts'
	| 'changeFolder'
	| 'changePlace'
	| 'changeRoute'
	| 'changeSetting'
	| 'measure'
	| 'places'
	| 'routes'
	| 'backupState'
	| 'saved'
>>;

type DnDStore = Pick<
	MainStore,
	| 'treeParams'
	| 'getSrts'
	| 'changeFolder'
	| 'changePlace'
	| 'changeRoute'
	| 'changeSetting'
	| 'measure'
	| 'places'
	| 'routes'
	| 'backupState'
	| 'saved'
>;

const getStore = (
	mainStore: MainStore,
	overrides?: DnDStoreOverrides,
): DnDStore => ({
	treeParams: overrides?.treeParams ?? mainStore.treeParams,
	getSrts: overrides?.getSrts ?? mainStore.getSrts,
	changeFolder: overrides?.changeFolder ?? mainStore.changeFolder,
	changePlace: overrides?.changePlace ?? mainStore.changePlace,
	changeRoute: overrides?.changeRoute ?? mainStore.changeRoute,
	changeSetting: overrides?.changeSetting ?? mainStore.changeSetting,
	measure: overrides?.measure ?? mainStore.measure,
	places: overrides?.places ?? mainStore.places,
	routes: overrides?.routes ?? mainStore.routes,
	backupState: overrides?.backupState ?? mainStore.backupState,
	saved: overrides?.saved ?? mainStore.saved,
});

// SEC Drop handlers

const handleFolderDropped = (
	payload: DragFolderPayload,
	target: HTMLElement,
	store: DnDStore,
): void => {
	if (!payload.id) return;
	const folders = store.treeParams[payload.context].folders;
	const targetType = target.dataset.entityType;
	const targetId = target.dataset.entityId === 'null' ? null : target.dataset.entityId;
	if (
		targetId === undefined ||
		targetId === payload.id ||
		targetType !== 'folder' ||
		isAncestorOf({
			ancestorId: payload.id,
			descendantId: targetId,
			relativesList: folders,
		})
	) {
		return;
	}
	const folder = folders[payload.id];
	let parentId: string | null = targetId;
	let srt: number;
	const srts = targetId
		? store.getSrts(targetId, targetType, payload.context)
		: undefined
	;
	switch (payload.position) {
		case 'before':
		case 'after':
			srt = srts
				? payload.position === 'before'
					? srts.before
					: srts.after
				: 10
			;
			parentId = targetId
				? folders[targetId]?.parent ?? null
				: null
			;
			break;
		default:
			srt = srts ? srts.max + 10 : 10;
			break;
	}
	store.changeFolder({
		entity: folder,
		change: {
			srt,
			parent: parentId,
		},
	});
};

const handleEntityDropped = (
	payload: DragPlacePayload | DragRoutePayload | DragSettingPayload,
	target: HTMLElement,
	store: DnDStore,
): void => {
	const folders = store.treeParams[payload.context].folders;
	const entities = store.treeParams[payload.context].entities;
	const targetType = target.dataset.entityType;
	const targetId = target.dataset.entityId === 'null' ? null : target.dataset.entityId;
	if (
		targetId === undefined ||
		(targetId === payload.id && targetType === payload.type) ||
		!isTreeItemType(targetType)
	) {
		return;
	}
	const parentId = targetId
		? targetType !== 'folder'
			? entities[targetId].folderid
			: target.dataset.entitySortArea
				? folders[targetId]?.parent ?? null
				: targetId
		: null
	;
	let srt: number;
	const entity = entities[payload.id];
	const srts = targetId
		? store.getSrts(targetId, targetType, payload.context)
		: undefined
	;
	switch (payload.position) {
		case 'before':
		case 'after':
			srt = srts
				? payload.position === 'before'
					? srts.before
					: srts.after
				: 10
			;
			break;
		default:
			srt = srts ? srts.max + 10 : 10;
			break;
	}
	if (payload.context === 'places') {
		store.changePlace({
			entity: entity as Place,
			change: {
				srt,
				folderid: parentId,
			},
		});
	}
	if (payload.context === 'routes') {
		store.changeRoute({
			entity: entity as Route,
			change: {
				srt,
				folderid: parentId,
			},
		});
	}
	if (payload.context === 'settings') {
		store.changeSetting({
			entity: entity as Setting,
			change: {
				srt,
				folderid: parentId,
			},
		});
	}
};

const handlePointInListDropped = (
	payload: DragPointInListPayload,
	target: HTMLElement,
	store: DnDStore,
): void => {
	const targetIndex = Number(target.dataset.entityIndex);
	if (
		payload.index === targetIndex ||
		payload.context !== target.dataset.entityContext ||
		(payload.context === 'routes' && typeof payload.parentId !== 'string')
	) {
		return;
	}
	let parent: Route | Measure | undefined;
	if (payload.context === 'measure') {
		parent = store.measure;
	}
	if (payload.context === 'routes' && payload.parentId) {
		parent = store.routes[payload.parentId];
	}
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
	store.backupState();
};

const handleImageDropped = (
	payload: DragImagePayload,
	target: HTMLElement,
	store: DnDStore,
): void => {
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
	let parent;
	if (payload.context === 'places') parent = store.places[payload.parentId];
	if (payload.context === 'routes') parent = store.routes[payload.parentId];
	if (!parent || !parent.images) return;
	moveInObject(
		parent.images,
		payload.id,
		targetId,
		'srt',
		payload.position === 'before',
	);
	parent.updated = true;
	store.saved = false;
	store.backupState();
};

// SEC UI

export const usePointerDnD = (config: {
	canAcceptDrop: (target: HTMLElement) => boolean,
	updateHighlights?: (target: HTMLElement | null) => void,
	onDragStateChange?: (isDragging: boolean) => void,
	threshold?: number,
	overrides?: DnDStoreOverrides,
}) => {
	const mainStore = useMainStore();
	const store = getStore(mainStore, config.overrides);
	const threshold = config.threshold ?? 7;
	let start = { x: 0, y: 0 };
	let offset = { x: 0, y: 0 };
	let ghostEl: HTMLElement | null = null;

	const onPointerDown = (event: PointerEvent, payload: DragEntityPayload) => {
		if (event.buttons !== 1 || event.ctrlKey || event.metaKey) return;
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		el.setPointerCapture(event.pointerId);
		start = {
			x: event.clientX,
			y: event.clientY,
		};
		offset = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
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
			const duration = Date.now() - (payload.startTime ?? Date.now());
			if (duration > 500) {
				mainStore.currentDrag = null;
				return;
			}
			const dist = Math.hypot(
				event.clientX - start.x,
				event.clientY - start.y,
			);
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
				0
			)`;
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
				handleDrop(dropTarget, store, mainStore);
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

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp,
	};
};

// SEC Drop dispatcher

const handleDrop = (
	target: HTMLElement,
	store: DnDStore,
	mainStore: ReturnType<typeof useMainStore>,
): void => {
	const payload = mainStore.currentDrag;
	if (!payload) return;
	switch (payload.type) {
		case 'folder':
			handleFolderDropped(
				payload as DragFolderPayload,
				target,
				store,
			);
			break;
		case 'place':
		case 'route':
		case 'setting':
			handleEntityDropped(
				payload as
					| DragPlacePayload
					| DragRoutePayload
					| DragSettingPayload
				,
				target,
				store,
			);
			break;
		case 'point':
			handlePointInListDropped(
				payload as DragPointInListPayload,
				target,
				store,
			);
			break;
		case 'image':
			handleImageDropped(
				payload as DragImagePayload,
				target,
				store,
			);
			break;
	}
	mainStore.currentDrag = null;
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

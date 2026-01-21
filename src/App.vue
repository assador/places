<template>
	<div ref="container" id="container" :class="`colortheme-${colortheme}`">
		<PopupConfirm
			v-if="confirmPopup"
			:callback="confirmCallback"
			:arguments="confirmCallbackArgs"
			:message="confirmMessage"
		/>
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onBeforeMount } from 'vue'
import axios from 'axios';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { emitter, moveInArrayAfter, moveInObject } from '@/shared';
import { Place, Track, Image, Folder, Point } from '@/stores/types';
import PopupConfirm from '@/components/popups/PopupConfirm.vue';

// Refs and Provides
const draggingElement = ref<null | Element>(null);
const draggingType = ref<string | null>(null);
const foldersEditMode = ref(false);
const idleTimeInterval = ref(null);
const currentPlaceCommon = ref(false);
const currentTrackCommon = ref(false);
const selectedToExport = ref({});
const installEvent = ref<any>(null);

provide('foldersEditMode', foldersEditMode);
provide('idleTimeInterval', idleTimeInterval);
provide('currentPlaceCommon', currentPlaceCommon);
provide('currentTrackCommon', currentTrackCommon);
provide('selectedToExport', selectedToExport);
provide('installEvent', installEvent);

onBeforeMount(() => {
	window.addEventListener('beforeinstallprompt', e => {
		e.preventDefault();
		installEvent.value = e;
	});
});

const mainStore = useMainStore();
const router = useRouter();

const colortheme = computed(() => mainStore.colortheme);
const colorthemes = computed(() => [
	{ value: 'brown',        title: mainStore.t.i.inputs.colorthemeBrown },
	{ value: 'blue',         title: mainStore.t.i.inputs.colorthemeBlue },
	{ value: 'pink',         title: mainStore.t.i.inputs.colorthemePink },
	{ value: 'green',        title: mainStore.t.i.inputs.colorthemeGreen },
	{ value: 'pink-light',   title: mainStore.t.i.inputs.colorthemePinkLight },
	{ value: 'blue-light',   title: mainStore.t.i.inputs.colorthemeBlueLight },
	{ value: 'purple-light', title: mainStore.t.i.inputs.colorthemePurpleLight },
	{ value: 'green-light',  title: mainStore.t.i.inputs.colorthemeGreenLight },
]);
provide('colorthemes', colorthemes);

const confirmPopup = ref(false);
const confirmCallback = ref<Function | null>(null);
const confirmCallbackArgs = ref<any[] | null>(null);
const confirmMessage = ref<string | null>(null);
provide('confirmPopup', confirmPopup);

const confirm = (func: Function, args: any[] = [], msg: string = ''): boolean => {
	confirmPopup.value = true;
	confirmCallback.value = func;
	confirmCallbackArgs.value = args;
	confirmMessage.value = msg;
	return true;
};

// Event Bus Handlers
emitter.on('logged', async () => {
	await mainStore.setUser();
	await mainStore.setServerConfig();
	await mainStore.setPlaces();
	await mainStore.setUsers('common');
	mainStore.ready = true;
	mainStore.backupState();
	router.push({ name: 'Home' });
});
emitter.on('logout', () => {
	const getOut = () => {
		router.push({ name: 'Auth' });
		mainStore.unload();
	};
	(mainStore.saved || mainStore.user.testaccount)
		? getOut()
		: confirm(getOut, [], mainStore.t.i.text.notSaved);
});
emitter.on('confirm', (object: { func: Function, args: any[], msg: string }): void => {
	const { func, args, msg } = object;
	confirm(func, args, msg);
});

emitter.on('toDB', (payload: Record<string, any>) => {
	if (payload) {
		toDB(payload);
	} else {
		toDB({
			'points': Object.values(mainStore.points),
			'places': Object.values(mainStore.places),
			'tracks': Object.values(mainStore.tracks),
			'folders': Object.values(mainStore.foldersFlat),
		});
	}
});
emitter.on('homeToDB', (id: string) => homeToDB(id));
emitter.on('toDBCompletely', () => toDBCompletely());
emitter.on('getFolderById', (id: string) => mainStore.foldersFlat[id]);
mainStore.changeLang(mainStore.lang);

// Lifecycle
onMounted(() => {
	const state = sessionStorage.getItem('places-store-state');
	if (state) mainStore.replaceState(JSON.parse(state));

	mainStore.$onAction(({
		// name,
		// store,
		// args,
		after,
		// onError,
	}): void => {
/*
		const actions = [
			'addPlace',
			'changePlace',
			'deleteObjects',
			'addTrack',
			'changeTrack',
			'addFolder',
			'changeFolder',
			'addTemp',
			'changePoint',
			'deleteTemp',
			'setHomePlace',
			'swapSrts',
		];
*/
		after(() => {
			// if (actions.includes(name)) {
				mainStore.idleTime = 0;
			// }
		});
	});
});

// DB Operations
const toDB = async (payload: Record<string, any>): Promise<void> => {
	if (mainStore.user.testaccount) return;
	if (document.querySelector('.value_wrong')) {
		mainStore.setMessage(mainStore.t.m.paged.incorrectFields);
		return;
	}
	const userid = sessionStorage.getItem('places-useruuid');
	const sessionid = sessionStorage.getItem('places-session');
	await axios.post(`/backend/set_places.php`, {
		data: payload,
		userid: userid,
		sessionid: sessionid,
	})
		.then(() => {
			mainStore.savedToDB(payload);
			mainStore.setMessage(mainStore.t.m.popup.savedToDb);
		})
		.catch(error => {
			mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
		})
	;
};
provide('toDB', toDB);

const toDBCompletely = async (): Promise<void> => {
	if (mainStore.user.testaccount) return;
	const filterChanged = <T extends {
		added?: boolean;
		deleted?: boolean;
		updated?: boolean;
	}>(arr: Record<string, T>) => {
		Object.values(arr).filter(item => item.added || item.deleted || item.updated);
	}
	toDB({
		'points': filterChanged(mainStore.points),
		'places': filterChanged(mainStore.places),
		'tracks': filterChanged(mainStore.places),
		'folders': filterChanged(mainStore.folders),
	});
};
provide('toDBCompletely', toDBCompletely);

const homeToDB = async (id: string): Promise<void> => {
	if (mainStore.user.testaccount) return;
	try {
		await axios.post('/backend/set_home.php', {
			id: sessionStorage.getItem('places-useruuid'),
			data: id
		});
		mainStore.saved = true;
		mainStore.setMessage(mainStore.t.m.popup.savedToDb);
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
	}
};

const deleteImages = (images: Record<string, Image>, family?: boolean): void => {
	const data = new FormData();
	Object.entries(images).forEach(([id, image]) => data.append('file_' + id, image.file));
	data.append('userid', mainStore.user.id);
	if (!mainStore.user.testaccount) {
		axios.post('/backend/delete.php', data)
			.then(() => toDB({ 'images_delete': Object.values(images) }));
	}
	mainStore.deleteImages({ images, family });
};
provide('deleteImages', deleteImages);

const exportPlaces = (places: Record<string, Place>, mime?: string): void => {
	const a = document.createElement('a');
	let content = '';
	if (mime === 'application/gpx+xml') {
		a.download = 'places.gpx';
		a.dataset.downloadurl = ['application/gpx+xml', a.download, a.href].join(':');
		content = [
			'<?xml version="1.0" encoding="utf-8" standalone="yes"?>',
			'<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">'
		].join('');
		for (const p of Object.values(places)) {
			const wp = mainStore.points[p.pointid];
			content += `<wpt lat="${wp.latitude}" lon="${wp.longitude}">`;
			if (p.name) content += `<name>${p.name}</name>`;
			if (p.description) content += `<desc>${p.description}</desc>`;
			if (p.link) content += `<link href="${p.link}"></link>`;
			if (p.time) content += `<time>${p.time}</time>`;
			content += '</wpt>';
		}
		content += '</gpx>';
	} else {
		mime = 'application/json';
		a.download = 'places.json';
		a.dataset.downloadurl = ['application/json', a.download, a.href].join(':');
		const points: Point[] = [];
		const folders: Folder[] = [];
		const placesArray: Place[] = [];
		const foldersSet = new Set<string>();
		for (const p of Object.values(places)) {
			points.push({ ...mainStore.points[p.pointid] });
			let folderId = p.folderid;
			while (folderId && folderId !== 'root' && !foldersSet.has(folderId)) {
				const folder = mainStore.foldersFlat[folderId];
				folders.push({ ...folder });
				foldersSet.add(folderId);
				folderId = folder.parent;
			}
		}
		for (const place of Object.values(places)) {
			const p = { ...place };
			['type', 'show', 'added', 'deleted', 'updated', 'geomark', 'images'].forEach(k => delete (p as any)[k]);
			placesArray.push(p);
		}
		points.forEach(wp => ['type', 'show', 'added', 'deleted', 'updated'].forEach(k => delete (wp as any)[k]));
		folders.forEach(f => ['type', 'added', 'deleted', 'updated', 'opened', 'builded', 'geomarks', 'children'].forEach(k => delete (f as any)[k]));
		content = JSON.stringify({ places: placesArray, points, folders });
	}
	a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
	a.click();
};
provide('exportPlaces', exportPlaces);

// --- Drag & Drop Handlers ---
const handleDragStart = (event: Event, type?: string): void => {
	(event as any).dataTransfer.setData('text/plain', null);
	draggingElement.value = event.target as Element;
	if (type) draggingType.value = type;
};
provide('handleDragStart', handleDragStart);

const handleDragEnter = (event: Event): void => {
	event.preventDefault();
	event.stopPropagation();
	const el = event.target as HTMLElement;
	switch (draggingType.value) {
		case 'measure':
			const el1 = draggingElement.value as HTMLElement;
			const el2 = event.target as HTMLElement;
			const id1 = el1.dataset.placesMeasurePointId;
			const id2 = el2.dataset.placesMeasurePointId;
			if (!id1 || !id2) return;
			const ids = mainStore.measure.points;
			const idx1 = ids.indexOf(id1), idx2 = ids.indexOf(id2);
			[ids[idx1], ids[idx2]] = [ids[idx2], ids[idx1]];
			mainStore.measure.points = ids;
			mainStore.measureDistance();
			draggingElement.value = el2;
			return;
		default:
			const dragEl = draggingElement.value as HTMLElement;
			const dragPP = (draggingElement.value as Element).parentElement?.parentElement;
			const addClass = (cls: string) => el.classList.add(cls);
			if (
				el.dataset.placesTreeFolderId &&
				el.dataset.placesTreeType === dragEl.dataset.placesTreeType &&
				(dragEl.dataset.placesTreeFolderId || dragEl.dataset.placesTreeItemId)
			) {
				addClass('highlighted');
			}
			if (dragEl.dataset.placesTreeItemId) {
				if (el.dataset.placesTreeItemSortingAreaTop &&
					el.parentElement !== draggingElement.value &&
					el.parentElement !== (draggingElement.value as Element).nextElementSibling) {
					addClass('dragenter-area_top_border');
				} else if (el.dataset.placesTreeItemSortingAreaBottom &&
					el.parentElement !== draggingElement.value &&
					el.parentElement !== (draggingElement.value as Element).previousElementSibling) {
					addClass('dragenter-area_bottom_border');
				}
			} else if (dragEl.dataset.placesTreeFolderId) {
				if (el.dataset.placesTreeFolderSortingAreaTopFolderid &&
					el.parentElement !== dragPP &&
					el.parentElement !== dragPP?.nextElementSibling) {
					addClass('dragenter-area_top_border');
				} else if (el.dataset.placesTreeFolderSortingAreaTopFolderid &&
					el.parentElement !== dragPP &&
					el.parentElement !== dragPP?.previousElementSibling) {
					addClass('dragenter-area_bottom_border');
				}
			}
	}
};
provide('handleDragEnter', handleDragEnter);

const handleDragLeave = (event: Event): void => {
	const el = event.target as Element;
	if (el.nodeType === 1) {
		event.preventDefault();
		['highlighted', 'dragenter-area_top_border', 'dragenter-area_bottom_border']
			.forEach(cls => el.classList.remove(cls));
	}
};
provide('handleDragLeave', handleDragLeave);

const handleDragOver = (event: Event): void => {
	event.preventDefault();
};
provide('handleDragOver', handleDragOver);

const handleDrop = (event: Event, params?: Record<string, any>): void => {
	draggingType.value = null;
	if (!draggingElement.value) return;
	event.preventDefault();
	event.stopPropagation();
	const el = event.target as Element;
	if (el.nodeType !== 1 || (draggingElement.value === el && !(draggingElement.value as any).dataset.image)) return;

	const folder: Record<string, any> = {};
	const item: Record<string, any> = {};

	const cleanup = () => {
		el.dispatchEvent(new Event('dragleave'));
		draggingElement.value = null;
	};

	// Image thumbnail dropped on another image thumbnail
	if (Object.hasOwn((draggingElement.value as HTMLElement).dataset, 'image')) {
		const upperId = (draggingElement.value as HTMLElement).dataset.image;
		const lowerId = (el as HTMLElement).dataset.image;
		if (
			!Object.hasOwn(mainStore.currentPlace.images, upperId) ||
			!Object.hasOwn(mainStore.currentPlace.images, lowerId)
		) {
			return;
		}
		const images = mainStore.currentPlace.images;
		moveInObject(
			images,
			images[upperId],
			images[lowerId],
			'srt',
			params && params.before ? true : false
		);
		mainStore.currentPlace.updated = true;
		toDB({ 'images_update': Object.values(mainStore.currentPlace.images) });
		mainStore.currentPlace.updated = false;
		cleanup();
		return;
	}

	// Point button dropped on another point button
	if (Object.hasOwn((draggingElement.value as HTMLElement).dataset, 'point')) {
		const upperId = (draggingElement.value as HTMLElement).dataset.point;
		const upperIdx = Number((draggingElement.value as HTMLElement).dataset.pointidx);
		const lowerId = (el as HTMLElement).dataset.point;
		const lowerIdx = Number((el as HTMLElement).dataset.pointidx);
		const pointOf = (draggingElement.value as HTMLElement).dataset.pointof;
		const points =
			pointOf === 'track'
				? mainStore.currentTrack.points
				: mainStore.measure.points
		;
		if (!points.includes(upperId) || !points.includes(lowerId)) return;
		moveInArrayAfter(points, upperIdx, lowerIdx);
		return;
	}

	// Tree item dropped on tree folder
	if (
		!!(item.sourceId = (draggingElement.value as any).dataset.placesTreeItemId) &&
		!!(item.targetId = (el as any).dataset.placesTreeFolderId) &&
		!!(item.sourceParentId = (draggingElement.value as any).dataset.placesTreeItemParentId) &&
		item.sourceParentId !== item.targetId
	) {
		const sourceType = (draggingElement.value as any).dataset.placesTreeItemType;
		const targetType = (el as any).dataset.placesTreeType;
		if (sourceType !== targetType) return;

		mainStore.backup = false;
		const items: Record<string, Place | Track> = mainStore[targetType + 's'];
		const neighbours = Object.values(items).filter(
			i => i.folderid === item.targetId
		);
		items[item.sourceId].srt = neighbours.length
			? Math.max(...neighbours.map(i => i.srt)) + 1
			: 1
		;
		items[item.sourceId].folderid = item.targetId;

		items[item.sourceId].updated = true;
		toDB({ 'places': [ items[item.sourceId] ] });
		items[item.sourceId].updated = false;

		mainStore.backup = true;
		mainStore.backupState();

		cleanup();
		return;
	}

	// Tree item dropped on sorting area of another tree item
	if (
		!!(item.sourceId = (draggingElement.value as any).dataset.placesTreeItemId) &&
		!!(item.targetId = (el as any).dataset.placesTreeItemId) && (
		(el as any).dataset.placesTreeItemSortingAreaTop ||
		(el as any).dataset.placesTreeItemSortingAreaBottom)
	) {
		const sourceType = (draggingElement.value as any).dataset.placesTreeItemType;
		const targetType = (el as any).dataset.placesTreeItemType;
		if (sourceType !== targetType) return;

		mainStore.backup = false;
		const sourceItem = mainStore[sourceType + 's'][item.sourceId];
		const targetItem = mainStore[targetType + 's'][item.targetId];
		sourceItem.srt = mainStore.getNeighboursSrts(
			item.targetId,
			targetType,
			!!(el as any).dataset.placesTreeItemSortingAreaTop
		).new;
		sourceItem.folderid = targetItem.folderid;

		sourceItem.updated = true;
		toDB({ 'places': [ sourceItem ] });
		sourceItem.updated = false;

		mainStore.backup = true;
		mainStore.backupState();

		cleanup();
		return;
	}

	// Tree folder dropped on sorting area of another tree folder
	if (
		!!(folder.sourceId = (draggingElement.value as any).dataset.placesTreeFolderId) && (
		!!(folder.targetId = (el as any).dataset.placesTreeFolderSortingAreaTopFolderid ||
		(el as any).dataset.placesTreeFolderSortingAreaBottomFolderid))
	) {
		const top = (el as any).dataset.placesTreeFolderSortingAreaTopFolderid;
		const srts = mainStore.getNeighboursSrts(folder.targetId, 'folder', top);
		mainStore.changeFolder({
			folder: mainStore.folders[folder.sourceId],
			change: {
				srt: srts.new,
				parent: mainStore.folders[folder.targetId].parent
			},
		});
		mainStore.buildTrees();

		mainStore.folders[folder.sourceId].updated = true;
		toDB({ 'folders': [ mainStore.folders[folder.sourceId] ] });
		mainStore.folders[folder.sourceId].updated = false;

		mainStore.backup = true;
		mainStore.backupState();

		cleanup();
		return;
	}

	// Tree folder dropped on another tree folder
	if (
		!!(folder.sourceId = (draggingElement.value as any).dataset.placesTreeFolderId) &&
		!!(folder.targetId = (el as any).dataset.placesTreeFolderId) &&
		folder.sourceId !== folder.targetId &&
		(draggingElement.value as any).dataset.placesTreeType === (el as any).dataset.placesTreeType
	) {
		mainStore.backup = false;
		const neighbours = Object.values(mainStore.folders).filter(
			f => f.parent === folder.targetId
		);

		mainStore.folders[folder.sourceId].srt = Math.max(...neighbours.map(f => f.srt)) + 1;
		mainStore.folders[folder.sourceId].parent = folder.targetId;
		mainStore.buildTrees();

		mainStore.folders[folder.sourceId].updated = true;
		toDB({ 'folders': [ mainStore.folders[folder.sourceId] ] });
		mainStore.folders[folder.sourceId].updated = false;

		mainStore.backup = true;
		mainStore.backupState();

		cleanup();
		return;
	}

	cleanup();
};
provide('handleDrop', handleDrop);
</script>

<style lang="scss">
@use '@/assets/styles/style.scss';
@use '@/assets/styles/layout.scss';
</style>

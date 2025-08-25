<template>
	<div ref="container" id="container" :class="`colortheme-${colortheme}`">
		<places-popup-confirm
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
import { emitter } from '@/shared/bus'
import { isParentInTree } from '@/shared/common';
import { Place, Image, Folder, Waypoint } from '@/stores/types';
import PlacesPopupConfirm from '@/components/PlacesPopupConfirm.vue';

// Refs and Provides
const container = ref<null | HTMLElement>(null);
const draggingElement = ref<null | Element>(null);
const draggingType = ref<string | null>(null);
const foldersEditMode = ref(false);
const idleTimeInterval = ref(null);
const currentPlaceCommon = ref(false);
const selectedToExport = ref({});
const installEvent = ref<any>(null);

provide('foldersEditMode', foldersEditMode);
provide('idleTimeInterval', idleTimeInterval);
provide('currentPlaceCommon', currentPlaceCommon);
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

const currentPlace = computed(() => mainStore.currentPlace);
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
	router.push({ name: 'PlacesHome' });
});
emitter.on('logout', () => {
	const getOut = () => {
		router.push({ name: 'PlacesAuth' });
		mainStore.unload();
	};
	mainStore.saved
		? getOut()
		: confirm(getOut, [], mainStore.t.i.text.notSaved);
});
emitter.on('confirm', ({func, args, msg}): void => {
	confirm(func, args, msg);
});

emitter.on('toDB', (payload: Record<string, any>) => {
	const { what, data } = payload;
	const getData = (key: string) => data ? data : Object.values(mainStore[key]);
	switch (what) {
		case 'waypoints': toDB({ what, data: getData('waypoints') }); break;
		case 'places':    toDB({ what, data: getData('places') });    break;
		case 'folders':   toDB({ what, data: getData('treeFlat') });  break;
		case undefined:
			toDB({ what: 'waypoints', data: Object.values(mainStore.waypoints) });
			toDB({ what: 'places',    data: Object.values(mainStore.places) });
			toDB({ what: 'folders',   data: Object.values(mainStore.treeFlat) });
			break;
		default: toDB(payload);
	}
});
emitter.on('homeToDB', (id: string) => homeToDB(id));
emitter.on('toDBCompletely', () => toDBCompletely());
emitter.on('getFolderById', (id: string) => mainStore.treeFlat[id]);
mainStore.changeLang(mainStore.lang);

// Lifecycle
onMounted(() => {
	const state = sessionStorage.getItem('places-store-state');
	if (state) mainStore.replaceState(JSON.parse(state));
	const resetIdle = () => { mainStore.idleTime = 0; };
	document.addEventListener('mousedown', resetIdle, false);
	document.addEventListener('keyup', resetIdle, false);

	mainStore.$onAction((action): void => {
		const actions = [
			'addPlace',
			'changePlace',
			'deletePlace',
			'addFolder',
			'changeFolder',
			'deleteFolder',
			'moveFolder',
			'addTemp',
			'changeWaypoint',
			'deleteTemp',
			'setHomePlace',
			'swapImages',
		];
		if (actions.includes(action.name)) {
			mainStore.backup = true;
		}
	});
});

// DB Operations
const toDB = async (payload: Record<string, any>): Promise<void> => {
	if (mainStore.user.testaccount) return;
	if (document.querySelector('.value_wrong')) {
		mainStore.setMessage(mainStore.t.m.paged.incorrectFields);
		return;
	}
	payload.id = sessionStorage.getItem('places-userid');
	try {
		const { data: response } = await axios.post(
			`/backend/set_${payload.what === 'waypoints' ? 'waypoints' : 'places'}.php`,
			payload
		);
		if (payload.what === 'waypoints' && response.length > 0) {
			for (const rec of response) {
				if (!mainStore.waypoints[rec.waypoint.id]) {
					mainStore.addWaypoint({ waypoint: rec.waypoint, todb: false });
				}
				mainStore[
					'change' + rec.waypointof.type.charAt(0).toUpperCase() + rec.waypointof.type.slice(1)
				]({
					[rec.waypointof.type]: mainStore[rec.waypointof.type + 's'][rec.waypointof.id],
					change: { waypoint: rec.waypoint.id }
				});
			}
		} else {
			for (const fault of response) {
				switch (fault) {
					case 1: mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb); return;
					case 2: return;
					case 3: mainStore.setMessage(mainStore.t.m.popup.placesCountExceeded); return;
					case 4: mainStore.setMessage(mainStore.t.m.paged.foldersCountExceeded); return;
				}
			}
		}
		mainStore.savedToDB(payload);
		mainStore.setMessage(mainStore.t.m.popup.savedToDb);
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
	}
};
provide('toDB', toDB);

const toDBCompletely = async (): Promise<void> => {
	if (mainStore.user.testaccount) return;
	const filterChanged = <T extends { added?: boolean; deleted?: boolean; updated?: boolean }>(arr: Record<string, T>) =>
		Object.values(arr).filter(item => item.added || item.deleted || item.updated);
	await toDB({ what: 'waypoints', data: filterChanged(mainStore.waypoints) });
	await toDB({ what: 'places',    data: filterChanged(mainStore.places) });
	await toDB({ what: 'folders',   data: filterChanged(mainStore.treeFlat) });
};
provide('toDBCompletely', toDBCompletely);

const homeToDB = async (id: string): Promise<void> => {
	if (mainStore.user.testaccount) return;
	try {
		await axios.post('/backend/set_home.php', {
			id: sessionStorage.getItem('places-userid'),
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
			.then(() => toDB({ what: 'images_delete', data: Object.values(images) }));
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
			const wp = mainStore.waypoints[p.waypoint];
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
		const waypoints: Waypoint[] = [];
		const folders: Folder[] = [];
		const placesArray: Place[] = [];
		const foldersSet = new Set<string>();
		for (const p of Object.values(places)) {
			waypoints.push({ ...mainStore.waypoints[p.waypoint] });
			let folderId = p.folderid;
			while (folderId && folderId !== 'root' && !foldersSet.has(folderId)) {
				const folder = mainStore.treeFlat[folderId];
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
		waypoints.forEach(wp => ['type', 'show', 'added', 'deleted', 'updated'].forEach(k => delete (wp as any)[k]));
		folders.forEach(f => ['type', 'added', 'deleted', 'updated', 'opened', 'builded', 'geomarks', 'children'].forEach(k => delete (f as any)[k]));
		content = JSON.stringify({ places: placesArray, waypoints, folders });
	}
	a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
	a.click();
};
provide('exportPlaces', exportPlaces);

// --- Drag & Drop Handlers ---
const handleDragStart = (event: Event, type?: string): void => {
	mainStore.idleTime = 0;
	(event as any).dataTransfer.setData('text/plain', null);
	draggingElement.value = event.target as Element;
	if (type) draggingType.value = type;
};
provide('handleDragStart', handleDragStart);

const handleDragEnter = (event: Event): void => {
	event.preventDefault();
	event.stopPropagation();
	if (!draggingElement.value || (event.target as Node).nodeType !== 1 || draggingElement.value === event.target) return;
	switch (draggingType.value) {
		case 'measure': {
			const el1 = draggingElement.value as Element;
			const el2 = event.target as Element;
			const id1 = el1.getAttribute('measureitem');
			const id2 = el2.getAttribute('measureitem');
			if (!id1 || !id2) return;
			const ids = mainStore.measure.points;
			const idx1 = ids.indexOf(id1), idx2 = ids.indexOf(id2);
			[ids[idx1], ids[idx2]] = [ids[idx2], ids[idx1]];
			mainStore.measure.points = ids;
			mainStore.measureDistance();
			draggingElement.value = el2;
			return;
		}
		case 'images': {
			const ids: string[] = [];
			for (const id in currentPlace.value.images) {
				if (id === (draggingElement.value as Element).id) ids.push(id);
				if (id === (event.target as Element).id) ids.push(id);
				if (ids.length === 2) break;
			}
			mainStore.swapImages({ place: currentPlace.value, ids });
			return;
		}
		default: {
			const el = event.target as HTMLElement;
			const dragEl = draggingElement.value as HTMLElement;
			const dragPP = (draggingElement.value as Element).parentElement?.parentElement;
			const addClass = (cls: string) => el.classList.add(cls);
			if (el.dataset.folderButton !== undefined &&
				(dragEl.dataset.folderButton !== undefined || dragEl.dataset.placeButton !== undefined)) {
				addClass('highlighted');
			}
			if (dragEl.dataset.placeButton !== undefined) {
				if (el.dataset.placeButtonDragenterAreaTop !== undefined &&
					el.parentElement !== draggingElement.value &&
					el.parentElement !== (draggingElement.value as Element).nextElementSibling) {
					addClass('dragenter-area_top_border');
				} else if (el.dataset.placeButtonDragenterAreaBottom !== undefined &&
					el.parentElement !== draggingElement.value &&
					el.parentElement !== (draggingElement.value as Element).previousElementSibling) {
					addClass('dragenter-area_bottom_border');
				}
			} else if (dragEl.dataset.folderButton !== undefined) {
				if (el.dataset.folderDragenterAreaTop !== undefined &&
					el.parentElement !== dragPP &&
					el.parentElement !== dragPP?.nextElementSibling) {
					addClass('dragenter-area_top_border');
				} else if (el.dataset.folderDragenterAreaBottom !== undefined &&
					el.parentElement !== dragPP &&
					el.parentElement !== dragPP?.previousElementSibling) {
					addClass('dragenter-area_bottom_border');
				}
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

const handleDrop = (event: Event): void => {
	draggingType.value = null;
	if (!draggingElement.value) return;
	event.preventDefault();
	event.stopPropagation();
	const el = event.target as Element;
	if (el.nodeType !== 1 || (draggingElement.value === el && !(draggingElement.value as any).dataset.image)) return;

	const getSrt = (el: Element) =>
		Number(el.parentElement?.getAttribute('srt') ||
			el.parentElement?.parentElement?.getAttribute('srt')) || 0;

	const changes: Record<string, any> = { folder: {}, place: {} };
	let newContainer: any;

	const change = () => {
		if (Object.keys(changes.place).length) {
			mainStore.changePlace({
				place: mainStore.places[(draggingElement.value as Element).id.match(/[\d\w]+$/)![0]],
				change: changes.place,
			});
		}
		if (Object.keys(changes.folder).length) {
			mainStore.moveFolder({
				folderId: changes.folder.id,
				targetId: changes.folder.parent,
				srt: Number(changes.folder.srt) || 0,
				backup: false,
			});
		}
	};
	const cleanup = () => {
		el.dispatchEvent(new Event('dragleave'));
		draggingElement.value = null;
	};

	// Place button dropped on folder link
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(el as any).dataset.folderButton !== undefined &&
		el.id.replace(/^.*-([^-]*)/, "$1") !== mainStore.places[(draggingElement.value as Element).id].folderid
	) {
		newContainer = el.parentElement?.nextElementSibling?.nextElementSibling;
		changes.place.srt = newContainer?.lastElementChild
			? mainStore.places[newContainer.lastElementChild.id].srt + 1
			: 1;
		changes.place.folderid = newContainer.id.replace(/^.*-([^-]*)/, "$1");
		change(); cleanup(); return;
	}

	// Place button dropped on top sorting area of another place button
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(el as any).dataset.placeButtonDragenterAreaTop !== undefined &&
		el.parentElement !== (draggingElement.value as Element).nextElementSibling
	) {
		const targetSrt = getSrt(el);
		const prevSib = el.parentElement?.previousElementSibling;
		changes.place.srt = prevSib
			? (targetSrt - Number(prevSib.getAttribute('srt') || 0)) / 2 + Number(prevSib.getAttribute('srt') || 0)
			: targetSrt / 2;
		if ((draggingElement.value as Element).parentElement !== el.parentElement?.parentElement) {
			changes.place.folderid = el.parentElement?.parentElement?.id.match(/[\d\w]+$/)![0];
		}
		el.classList.remove('dragenter-area_top_border');
		change(); cleanup(); return;
	}

	// Place button dropped on bottom sorting area of another place button
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(el as any).dataset.placeButtonDragenterAreaBottom !== undefined &&
		el.parentElement !== (draggingElement.value as Element).previousElementSibling
	) {
		const targetSrt = getSrt(el);
		const nextSib = el.parentElement?.nextElementSibling;
		changes.place.srt = nextSib
			? (Number(nextSib.getAttribute('srt') || 0) - targetSrt) / 2 + targetSrt
			: targetSrt + 1;
		if ((draggingElement.value as Element).parentElement !== el.parentElement?.parentElement) {
			changes.place.folderid = el.parentElement?.parentElement?.id.match(/[\d\w]+$/)![0];
		}
		el.classList.remove('dragenter-area_bottom_border');
		change(); cleanup(); return;
	}

	// Folder link dropped on sorting area of another folder link
	if (
		(draggingElement.value as any).dataset.folderButton !== undefined &&
		((el as any).dataset.folderDragenterAreaTop !== undefined || (el as any).dataset.folderDragenterAreaBottom !== undefined) &&
		!!(changes.folder.id = (draggingElement.value as Element).id.replace(/^.*-([^-]*)/, "$1")) &&
		!!(changes.folder.parent = el.parentElement?.parentElement?.parentElement?.parentElement?.id.replace(/^.*-([^-]*)/, "$1")) &&
		changes.folder.id !== changes.folder.parent &&
		!isParentInTree(mainStore.tree, 'children', changes.folder.id, changes.folder.parent)
	) {
		const targetSrt = getSrt(el);
		if ((el as any).dataset.folderDragenterAreaTop !== undefined &&
			(draggingElement.value as Element).parentElement?.parentElement !== el.parentElement?.previousElementSibling) {
			const prevSib = el.parentElement?.previousElementSibling;
			changes.folder.srt = prevSib
				? (targetSrt - Number(prevSib.getAttribute('srt') || 0)) / 2 + Number(prevSib.getAttribute('srt') || 0)
				: targetSrt / 2;
		} else if ((el as any).dataset.folderDragenterAreaBottom !== undefined &&
			(draggingElement.value as Element).parentElement?.parentElement !== el.parentElement?.nextElementSibling) {
			const nextSib = el.parentElement?.nextElementSibling;
			changes.folder.srt = nextSib
				? (Number(nextSib.getAttribute('srt') || 0) - targetSrt) / 2 + targetSrt
				: targetSrt + 1;
		}
		change(); cleanup(); return;
	}

	// Folder link dropped on another folder link
	if (
		(draggingElement.value as any).dataset.folderButton !== undefined &&
		(el as any).dataset.folderButton !== undefined &&
		!!(changes.folder.id = (draggingElement.value as Element).id.replace(/^.*-([^-]*)/, "$1")) &&
		!!(changes.folder.parent = el.id.replace(/^.*-([^-]*)/, "$1")) &&
		changes.folder.id !== changes.folder.parent &&
		(!mainStore.treeFlat[changes.folder.parent].children ||
			!mainStore.treeFlat[changes.folder.parent].children[changes.folder.id]) &&
		!isParentInTree(mainStore.tree, 'children', changes.folder.id, changes.folder.parent)
	) {
		newContainer = el.parentElement?.nextElementSibling?.firstElementChild;
		changes.folder.srt = (newContainer && newContainer.lastElementChild)
			? mainStore.treeFlat[newContainer.lastElementChild.id.replace(/^.*-([^-]*)/, "$1")].srt + 1
			: 1;
		change(); cleanup(); return;
	}

	// Image thumbnail dropped
	if ((draggingElement.value as any).dataset.image !== undefined) {
		mainStore.changePlace({ place: currentPlace.value, change: {} });
		toDB({ what: 'places', data: [currentPlace.value] });
		cleanup(); return;
	}
	cleanup();
};
provide('handleDrop', handleDrop);
</script>

<style lang="scss">
@use '@/assets/styles/style.scss';
@use '@/assets/styles/layout.scss';
</style>

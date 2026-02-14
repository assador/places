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
import { ref, computed, provide, onMounted } from 'vue'
import axios from 'axios';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import {
	emitter,
	usePWAInstall,
	handleFolderDropped,
	handlePlaceRouteDropped,
	handlePointInListDropped,
	handleImageDropped,
} from '@/shared';
import {
	Folder,
	Point,
	Place,
	Image,
	DataToDB,
	DragPayload
} from '@/stores/types';
import PopupConfirm from '@/components/popups/PopupConfirm.vue';

// Refs and Provides
const foldersEditMode = ref(false);
const idleTimeInterval = ref(null);
const currentPlaceCommon = ref(false);
const currentRouteCommon = ref(false);
const selectedToExport = ref({});
const pwa = usePWAInstall();

provide('foldersEditMode', foldersEditMode);
provide('idleTimeInterval', idleTimeInterval);
provide('currentPlaceCommon', currentPlaceCommon);
provide('currentRouteCommon', currentRouteCommon);
provide('selectedToExport', selectedToExport);
provide('pwa', pwa);

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

emitter.on('toDB', (payload: DataToDB) => {
	if (payload) {
		toDB(payload);
	} else {
		toDB(mainStore.getAllModifiedPackage);
	}
});
emitter.on('homeToDB', (id: string) => homeToDB(id));
emitter.on('getFolderById', (id: string) => mainStore.folders[id]);
mainStore.changeLang(mainStore.lang);

// Lifecycle
onMounted(() => {
	mainStore.$onAction(({
		// name,
		// store,
		// args,
		after,
		// onError,
	}): void => {
/*
		const actions = [
			'upsertFolder',
			'upsertPlace',
			'upsertPoint',
			'upsertRoute',
			'changeFolder',
			'changePlace',
			'changePoint',
			'changeRoute',
			'deleteObjects',
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

// SEC DB operations

const toDB = async (payload: DataToDB): Promise<void> => {
	if (document.querySelector('.value_wrong')) {
		mainStore.setMessage(mainStore.t.m.paged.incorrectFields);
		return;
	}
	if (!payload) payload = mainStore.getAllModifiedPackage;
	try {
		if (!mainStore.user.testaccount) {
			await axios.post(`/backend/set_places.php`, {
				data: payload,
				userid: sessionStorage.getItem('places-useruuid'),
				sessionid: sessionStorage.getItem('places-session'),
			});
		}
		mainStore.savedToDB(payload);
	} catch (error: any) {
		const errorMessage = error.response?.data?.message || error.message || error;
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${errorMessage}`);
	}
};

const homeToDB = async (id: string): Promise<void> => {
	if (mainStore.user.testaccount) return;
	try {
		await axios.post('/backend/set_home.php', {
			id: sessionStorage.getItem('places-useruuid'),
			data: id
		});
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
	}
};

const deleteImages = async (images: Record<string, Image>, family?: boolean) => {
	const data = new FormData();
	Object.entries(images).forEach(([id, image]) => data.append('file_' + id, image.file));
	data.append('userid', mainStore.user.id);
	if (!mainStore.user.testaccount) {
		try {
			await axios.post('/backend/delete.php', data);
			toDB({ images_delete: Object.values(images) });
		} catch (error) {
			console.error(error);
		}
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
			while (folderId && !foldersSet.has(folderId)) {
				const folder = mainStore.folders[folderId];
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
		folders.forEach(f => ['type', 'added', 'deleted', 'updated', 'open', 'builded', 'geomarks', 'children'].forEach(k => delete (f as any)[k]));
		content = JSON.stringify({ places: placesArray, points, folders });
	}
	a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
	a.click();
};
provide('exportPlaces', exportPlaces);

// SEC DnD

const handleDrop = (event: DragEvent) => {
	const rawData = event.dataTransfer?.getData('application/my-app-dnd');
	if (!rawData) return;

	const payload: DragPayload = JSON.parse(rawData);
	const target = event.currentTarget as HTMLElement;

	const handlers = {
		folder: handleFolderDropped,
		place: handlePlaceRouteDropped,
		route: handlePlaceRouteDropped,
		point: handlePointInListDropped,
		image: handleImageDropped, // TODO Refactor work with images at all.
	};
	const handler = handlers[payload.type];
	if (handler) handler(payload, target);

	mainStore.currentDrag = null;
};
provide('handleDrop', handleDrop);
</script>

<style lang="scss">
@use '@/assets/styles/style.scss';
@use '@/assets/styles/layout.scss';
</style>

<template>
	<div ref="container" id="container" :class="`colortheme-${colortheme}`">
		<div id="popup-root" />
		<PopupConfirm
			v-if="confirmPopup"
			:callback="confirmCallback"
			:arguments="confirmCallbackArgs"
			:message="confirmMessage"
		/>
		<Popup
			v-if="isMounted"
			:show="mainStore.busy"
			:position="popupBusy.position"
			:closeButton="false"
			:closeOnClick="false"
		>
			<template #popupSlot>
				<div class="spinner icon icon-eye-open-circled" />
				<!-- <div class="spinner icon icon-geomark-1-circled" /> -->
			</template>
		</Popup>
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import api from '@/api';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import {
	emitter,
	usePWAInstall,
	logoutRoutine,
	generateGpx,
	generateJson,
	handleFolderDropped,
	handlePlaceRouteDropped,
	handlePointInListDropped,
	handleImageDropped,
	IPlacesPopupProps,
} from '@/shared';
import {
	Place,
	DataToDB,
	DragPayload,
	DragEventCustom,
	ImportExportFormat,
} from '@/types';
import PopupConfirm from '@/components/popups/PopupConfirm.vue';
import Popup from '@/components/popups/Popup.vue';

// Refs and Provides
const isMounted = ref(false);
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
const popupBusy = ref<IPlacesPopupProps>({
	show: false,
	position: {
		top: '0',
		right: '0',
		bottom: '0',
		left: '0',
	},
});

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
	const getOut = async () => {
		const userId = localStorage.getItem('places-useruuid');
		const sessionId = localStorage.getItem('places-session');
		mainStore.unload();
		router.push({ name: 'Auth' });
		await logoutRoutine({ userId: userId, sessionId: sessionId });
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

// Lifecycle
onMounted(() => {
	isMounted.value = true;
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
		mainStore.setMessage(mainStore.t.m.paged.incorrectFields, 3);
		return;
	}
	if (!payload) payload = mainStore.getAllModifiedPackage;
	try {
		if (!mainStore.user.testaccount) {
			await api.post(
				`set_entities.php`,
				{
					data: payload,
					userid: localStorage.getItem('places-useruuid'),
					sessionid: localStorage.getItem('places-session'),
				},
				{ silent: true },
			);
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
		await api.post(
			'set_home.php',
			{ id: localStorage.getItem('places-useruuid'), data: id },
			{ silent: true },
		);
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
	}
};

const exportPlaces = (
	places: Record<string, Place>,
	format: ImportExportFormat = 'json'
): void => {
	let content = '';
	let filename = 'places.json';
	let mimeType = 'application/json';
	if (format === 'gpx') {
		content = generateGpx({
			places: places,
			points: mainStore.points,
		});
		filename = 'places.gpx';
		mimeType = 'application/gpx+xml';
	} else {
		content = generateJson({
			places: places,
			points: mainStore.points,
		});
	}
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 100);
};
provide('exportPlaces', exportPlaces);

// SEC DnD

const handleDrop = (event: DragEventCustom) => {
	const rawData = event.dataTransfer?.getData('application/my-app-dnd');
	if (!rawData) return;

	const payload: DragPayload = JSON.parse(rawData);
	payload.before = event.dragBefore ?? false;
	const target = event.currentTarget as HTMLElement;

	const handlers = {
		folder: handleFolderDropped,
		place: handlePlaceRouteDropped,
		route: handlePlaceRouteDropped,
		point: handlePointInListDropped,
		image: handleImageDropped,
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

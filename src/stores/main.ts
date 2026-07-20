import { ref, shallowRef, toRaw, watch } from 'vue';
import { defineStore } from 'pinia';
import { StoreMain, StoreMainStateRefs } from './types';
import {
	User,
	Point,
	Place,
	Route,
	Folder,
    Measure,
    Dictionary,
    FirstShow,
    DragEntityPayload,
    Tree,
    Mode,
} from '@/types';

import { constants } from '@/shared/constants';
import { getT } from '@/lang/ru';

import { useGettersEntity } from './getters/entity';
import { useGettersOther } from './getters/other';
import { useGettersRelate } from './getters/relate';
import { useGettersTree } from './getters/tree';

import { useActionsBackup } from './actions/backup';
import { useActionsDB } from './actions/db';
import { useActionsEntity } from './actions/entity';
import { useActionsImport } from './actions/import';
import { useActionsInit } from './actions/init';
import { useActionsRelate } from './actions/relate';
import { useActionsService } from './actions/service';
import { useActionsUI } from './actions/ui';

const skipKeys = new Set([
	'busyCount',
	'currentDrag',
	'idleTime',
	'messages',
	'messagesInterval',
	'messagesMouseOver',
	'messagesTimeout',
	'refreshing',
	't',
]);

export const useMainStore = defineStore('main', () => {

	const currentLang = ref<string>('ru');
	const translation = shallowRef<Dictionary>(getT());

	const store = {
		activeMapIndex:  ref<number>(0),
		backup:  ref<boolean>(true),
		busyCount:  ref<number>(0),
		center: ref<Record<string, number>>({
			latitude: Number(constants.map.initial.latitude),
			longitude: Number(constants.map.initial.longitude),
		}),
		centerMarkerShow:  ref<boolean>(true),
		colortheme:  ref<string>('brown'),
		commonMarkersShow:  ref<boolean>(false),
		commonPlaces:  ref<Record<string, Place>>({}),
		commonPlacesOnPageCount:  ref<number>(constants.commonplacesonpagecount),
		commonPlacesPage:  ref<number>(1),
		commonPlacesShow:  ref<boolean>(false),
		commonRoutes:  ref<Record<string, Route>>({}),
		commonRoutesOnPageCount:  ref<number>(constants.commonroutesonpagecount),
		commonRoutesPage:  ref<number>(1),
		commonRoutesShow:  ref<boolean>(false),
		currentDrag:  ref<DragEntityPayload | null>(null),
		currentPlaceId:  ref<string | null>(null),
		currentPointId:  ref<string | null>(null),
		currentRouteId:  ref<string | null>(null),
		first:  ref<boolean>(true),
		folders:  ref<Record<string, Folder>>({}),
		idleTime:  ref<number>(0),
		lang:  currentLang,
		langs: ref<Record<string, string>[]>([{
			value: 'ru',
			title: 'Русский',
		}, {
			value: 'en',
			title: 'English',
		}]),
		measure: ref<Measure>({
			type: 'measure',
			points: [],
			show: false,
		}),
		messages:  ref<string[]>([]),
		messagesMouseOver:  ref<boolean>(false),
		messagesInterval:  ref<number | null>(null),
		messagesTimeout:  ref<number | null>(null),
		mode:  ref<Mode>('normal'),
		newEntityPointId:  ref<string | null>(null),
		markersShow:  ref<boolean>(true),
		offlineMode:  ref<boolean>(false),
		online:  ref<boolean>(true),
		places:  ref<Record<string, Place>>({}),
		placesShow:  ref<FirstShow>({ show: true, first: true }),
		points:  ref<Record<string, Point>>({}),
		range:  ref<number | null>(null),
		rangeShow:  ref<boolean>(false),
		ready:  ref<boolean>(false),
		refreshing:  ref<boolean>(false),
		routes:  ref<Record<string, Route>>({}),
		routesShow:  ref<FirstShow>({ show: false, first: true }),
		saved:  ref<boolean>(true),
		selectedToExport: ref<Record<'places' | 'routes', string[]>>({
			places: [],
			routes: [],
		}),
		serverConfig:  ref<any | null>(null),
		stateBackups:  ref<any[]>([]),
		stateBackupsIndex:  ref<number>(-1),
		t:  translation,
		temps:  ref<Record<string, Point>>({}),
		tempsShow:  ref<FirstShow>({ show: false, first: true }),
		treeParams: ref<Record<string, Tree>>({
			places: {
				context: 'places',
				open: false,
			},
			routes: {
				context: 'routes',
				open: false,
			},
		}),
		user:  ref<User | null>(null),
		users:  ref<Record<string, Partial<User>>>({}),
		zoom:  ref<number>(constants.map.initial.zoom),
	} as StoreMain;

	const state: StoreMainStateRefs = store;

	const defaultState: Partial<StoreMainStateRefs> = {};
	for (const key in state) {
		if (!Object.hasOwn(state, key) || skipKeys.has(key)) continue;
		const stateKey = key as keyof StoreMainStateRefs;
		const stateValue = toRaw(state[stateKey].value);
		if (stateValue && typeof stateValue === 'object') {
			defaultState[stateKey] = structuredClone(stateValue);
		} else {
			defaultState[stateKey] = stateValue;
		}
	}
	store.$resetToDefault = () => {
		for (const key in defaultState) {
			if (!Object.hasOwn(defaultState, key)) continue;
			const stateKey = key as keyof StoreMainStateRefs;
			if (defaultState[stateKey] !== undefined) {
				const defaultValue = defaultState[stateKey];
				if (defaultValue && typeof defaultValue === 'object') {
					state[stateKey].value = structuredClone(defaultValue);
				} else {
					state[stateKey].value = defaultValue;
				}
			}
		}
	};

	const gettersEntity = useGettersEntity(store);
	const gettersOther  = useGettersOther(store, gettersEntity);
	const gettersRelate = useGettersRelate(store, gettersEntity);
	const gettersTree   = useGettersTree(store);

	const getters = {
		...gettersEntity,
		...gettersOther,
		...gettersRelate,
		...gettersTree,
	};
	Object.assign(store, getters);

	const actionsBackup  = useActionsBackup(store, state);
	const actionsDB      = useActionsDB(store);
	const actionsEntity  = useActionsEntity(store);
	const actionsImport  = useActionsImport(store);
	const actionsInit    = useActionsInit(store);
	const actionsRelate  = useActionsRelate(store);
	const actionsService = useActionsService(store);
	const actionsUI      = useActionsUI(store);

	const actions = {
		...actionsBackup,
		...actionsDB,
		...actionsEntity,
		...actionsImport,
		...actionsInit,
		...actionsRelate,
		...actionsService,
		...actionsUI,
	};
	Object.assign(store, actions);

	watch(currentLang, async (newLang) => {
		try {
			const module = await import(`@/lang/${newLang}.ts`);
			if (typeof module.getT === 'function') {
				translation.value = module.getT();
			}
		} catch (error) {
			console.error(error);
			store.setMessage(`Failed to load dictionary for language: ${newLang}`);
		}
	}, { immediate: false });

	return store;
}, {
	persist: {
		serializer: {
			deserialize: (value) => JSON.parse(value),
			serialize: (state) => {
				return JSON.stringify(state, (key, value) => {
					if (skipKeys.has(key)) return undefined;
					if (value && typeof value === 'object' && value.raw) return undefined;
					return value;
				});
			},
		},
	},
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { h, ref } from 'vue';

import { IMainState } from '@/types';
import { constants } from '@/shared/constants';
import { t } from '@/lang/ru';
import Home from '@/components/Home.vue';

// Minimal router
const router = createRouter({
	history: createMemoryHistory(),
	routes: [
  	{ name: 'Auth', path: '/auth', component: { render: () => h('div') } },
  	{ name: 'HomeImages', path: '/images/:imageId', component: { render: () => h('div') } },
  	{ name: 'HomeExport', path: '/export', component: { render: () => h('div') } },
  	{ name: 'HomeText', path: '/text/:what', component: { render: () => h('div') } },
  	{ name: 'HomeFolder', path: '/folder', component: { render: () => h('div') } },
 	],
});

// Stub heavy children
const stubs = {
	Header: { template: '<div id="stub-header" />' },
	Tree: { template: '<div id="stub-tree" />' },
	Points: { template: '<div id="stub-points" />' },
	Teleport: true,
};

// Mock shared helpers used directly
vi.mock('@/shared/common', () => ({
	makeDropDowns: vi.fn(),
	generateRandomString: () => 'x'.repeat(32),
	sortObjects: (arr: any[], key: string) => [...arr].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0)),
	coords2string: () => '0° 0\' 0"',
	string2coords: () => [0, 0],
}));

// Mock axios
vi.mock('axios', () => ({ default: { get: vi.fn().mockResolvedValue({ data: { elevation: 0 } }), post: vi.fn().mockResolvedValue({ data: [[], []] }) } }));

// Pinia store shape minimal implementation
function createMainStoreState(): IMainState {
	return {
		activeMapIndex: 0,
		backup: true,
		busyCount: 0,
		center: {
			latitude: Number(constants.map.initial.latitude),
			longitude: Number(constants.map.initial.longitude),
		},
		centerPlacemarkShow: true,
		colortheme: 'brown',
		commonPlacemarksShow: false,
		commonPlaces: {},
		commonPlacesOnPageCount: constants.commonplacesonpagecount,
		commonPlacesPage: 1,
		commonPlacesShow: false,
		commonRoutes: {},
		commonRoutesOnPageCount: constants.commonroutesonpagecount,
		commonRoutesPage: 1,
		commonRoutesShow: false,
		currentDrag: null,
		currentPlace: null,
		currentPoint: null,
		currentRoute: null,
		first: true,
		folders: {},
		idleTime: 0,
		lang: 'ru',
		langs: [{
			value: 'ru',
			title: 'Русский',
		}, {
			value: 'en',
			title: 'English',
		}],
		measure: {
			type: 'measure',
			points: [],
			choosing: null,
			show: false,
		},
		messages: [],
		messagesMouseOver: false,
		messagesInterval: null,
		messagesTimeout: null,
		mode: 'normal',
		newEntityPointId: null,
		placemarksShow: true,
		places: {},
		placesShow: { show: true, first: true },
		points: {},
		range: null,
		rangeShow: false,
		ready: false,
		refreshing: false,
		routes: {},
		routesShow: false,
		saved: true,
		serverConfig: null,
		stateBackups: [],
		stateBackupsIndex: -1,
		t: t,
		temps: {},
		tempsPlacemarksShow: true,
		tempsShow: { show: false, first: true },
		treeParams: {
			places: {
				context: 'places',
				open: false,
			},
			routes: {
				context: 'routes',
				open: false,
			},
		},
		user: null,
		users: {},
		zoom: Number(constants.map.initial.zoom),
	};
}

// Helper to mount Home with providers/injects
async function mountHome(options: { shallow?: boolean } = {}) {
	const testingPinia = createTestingPinia({
		createSpy: vi.fn,
		initialState: { main: createMainStoreState() },
	});
	// Injects required by Home.vue
	const provide = {
		idleTimeInterval: ref<number | undefined>(undefined),
		currentPlaceCommon: ref(false),
		currentRouteCommon: ref(false),
		foldersEditMode: ref(false),
		toDB: vi.fn(),
		toDBCompletely: vi.fn(),
		handleDrop: vi.fn(),
		installEvent: ref<any>(undefined),
	};
	router.push('/');
	await router.isReady();
	const wrapper = (options.shallow ? shallowMount : mount)(Home, {
		global: {
			plugins: [router, testingPinia],
			stubs,
			provide,
		},
	});
	await flushPromises();
	return wrapper;
}

describe('Home.vue', () => {
	beforeEach(() => {
		vi.useRealTimers();
	});

	it('renders basic layout controls', async () => {
		const wrapper = await mountHome({ shallow: true });
		// Buttons exist
		expect(wrapper.find('#actions-places').exists()).toBe(true);
		expect(wrapper.find('#actions-routes').exists()).toBe(true);
		expect(wrapper.find('#actions-points').exists()).toBe(true);
		// Search input is present
		expect(wrapper.find('#search-input').exists()).toBe(true);
	});

	it('toggles measure mode button state', async () => {
		const wrapper = await mountHome({ shallow: true });
		const btn = wrapper.find('#actions-measure');
		expect(btn.classes()).not.toContain('button-pressed');
		await btn.trigger('click');
		await wrapper.vm.$nextTick();
		expect(btn.classes()).toContain('button-pressed');
	});

	it('search clears on Escape', async () => {
		const wrapper = await mountHome({ shallow: true });
		const input = wrapper.find('#search-input');
		await input.setValue('abc');
		await input.trigger('keyup', { code: 'Escape' });
		expect((input.element as HTMLInputElement).value).toBe('');
	});
});

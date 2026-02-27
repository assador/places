import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import Home from '@/components/Home.vue';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { h, ref } from 'vue';

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

// Common translations used by Home.vue
const t = {
	i: {
		inputs: {
			searchPlaces: 'Search places',
			checkboxCommon: 'Common',
			placeName: 'Place name',
			placeDescription: 'Place description',
			routeName: 'Route name',
			routeDescription: 'Route description',
		},
		buttons: {
			find: 'Find',
			clear: 'Clear',
			clearAll: 'Clear all',
			range: 'Range',
			measure: 'Measure',
			install: 'Install',
			import: 'Import',
			export: 'Export',
			save: 'Save',
			undo: 'Undo',
			redo: 'Redo',
			addPhotos: 'Add photos',
			help: 'Help',
		},
		captions: {
			range: 'Range',
			measure: 'Measure',
			currentPlace: 'Current place',
			currentRoute: 'Current route',
			center: 'Center',
			points: 'Points',
			temporaryPoints: 'Temporary points',
			places: 'Places',
			routes: 'Routes',
			altitude: 'Altitude',
			latitude: 'Latitude',
			longitude: 'Longitude',
		},
		hints: {
			editFolders: 'Edit folders',
			mapProvider: 'Map provider',
			notSaved: 'Not saved',
			sabeToDb: 'Save to DB',
			install: 'Install app',
			importPlaces: 'Import',
			exportPlaces: 'Export',
			about: 'About',
			exit: 'Exit',
			shPlacemarks: 'Show placemarks',
			shCommonPlaces: 'Show common places',
			shCommonPlacemarks: 'Show common placemarks',
			shCommonRoutes: 'Show common routes',
			shCenter: 'Show center',
			fullscreen: 'Fullscreen',
		},
		text: { km: 'km' },
	},
	m: {
		popup: {
			testAccount: 'Test account',
			invalidImportFileType: 'Invalid file type',
			filesUploadedSuccessfully: 'Uploaded',
			file: 'File',
			fileNotImage: 'is not an image',
			fileTooLarge: 'is too large',
			filesNotImages: 'Files are not images',
			filesTooLarge: 'Files too large',
			filesUploadError: 'Upload error',
			taNotAllowFileUploads: 'Not allowed',
		},
	},
};

// Minimal constants used by component
vi.mock('@/shared/constants', () => ({
	constants: {
		compact: 1100,
		compactUltra: 800,
		compactControlButtons: 700,
		sidebars: { top: 80, right: 320, bottom: 40, left: 320 },
		sidebarsCompact: { top: 60, right: 240, bottom: 30, left: 240 },
		sidebarsCompactUltra: { top: 0, right: 0, bottom: 0, left: 0 },
		commonplacesonpagecount: 10,
		commonroutesonpagecount: 10,
		shortcuts: {},
		dirs: { uploads: { images: { small: '/img/' } } },
		map: { initial: { latitude : 0, longitude : 0, zoom : 15 } },
	},
}));

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
function createMainStoreState() {
	return {
		ready: true,
		messages: [],
		setMessage: vi.fn(),
		clearMessages: vi.fn(),
		user: { id: 'user-1', testaccount: true },
		center: { latitude: 0, longitude: 0 },
		points: {},
		places: {},
		commonPlaces: {},
		commonRoutes: {},
		folders: {},
		descriptionFields: { name: 'Name', description: 'Description', link: 'Link', time: 'Time', srt: 'Order', common: 'Common', latitude: 'Lat', longitude: 'Lon', coordsMinSec: 'Coords', altitudecapability: 'Altitude capability', images: 'Images' },
		measure: { show: false, points: [], choosing: 0, distance: 0 },
		mode: 'normal',
		centerPlacemarkShow: false,
		commonPlacemarksShow: false,
		placemarksShow: true,
		pointsShow: true,
		placesShow: true,
		routesShow: true,
		tempsShow: false,
		rangeShow: false,
		range: null,
		saved: true,
		serverConfig: { rights: { placescount: 100, routescount: 100, photosize: 10_000_000 }, mimes: { 'image/png': 'png' }, uploadsize: 10_000_000 },
		currentPlace: null,
		currentRoute: null,
		currentPoint: null,
		getDistance: vi.fn(),
		updateMap: vi.fn(),
		t: t,
		backupState: vi.fn(),
		setHomePlace: vi.fn(),
		commonPlacemarksShowHide: vi.fn(),
		commonRoutesShowHide: vi.fn(),
		placemarksShowHide: vi.fn(),
		centerPlacemarkShowHide: vi.fn(),
		undo: vi.fn(),
		redo: vi.fn(),
		restoreObjectsAsLinks: vi.fn(),
		setFirstCurrentPlace: vi.fn(),
		folderOpenClose: vi.fn(),
		addPlace: vi.fn(),
		addPoint: vi.fn(),
		changePlace: vi.fn().mockResolvedValue(undefined),
		addRoute: vi.fn(),
		changeRoute: vi.fn().mockResolvedValue(undefined),
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
		handleDragStart: vi.fn(),
		handleDragEnter: vi.fn(),
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

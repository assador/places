import localforage from 'localforage';

export const bufferInstance = localforage.createInstance({
	driver: localforage.INDEXEDDB,
	name: 'PlacesApp',
	storeName: 'entities',
});

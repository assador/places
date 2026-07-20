import localforage from 'localforage';

export const bufferOfModified = localforage.createInstance({
	driver: localforage.INDEXEDDB,
	name: 'PlacesApp',
	storeName: 'entities',
});

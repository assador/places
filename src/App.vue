<template>
	<div
		id="container"
		:class="'colortheme-' + colortheme"
	>
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import axios from 'axios';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { emitter } from '@/shared/bus'
import { isParentInTree } from '@/shared/common';
import { Place, Image, Folder, Waypoint } from '@/store/types';

const draggingElement = ref(null);
const foldersEditMode = ref(false);
provide('foldersEditMode', foldersEditMode);
const idleTimeInterval = ref(null);
provide('idleTimeInterval', idleTimeInterval);
const currentPlaceCommon = ref(false);
provide('currentPlaceCommon', currentPlaceCommon);
const selectedToExport = ref({});
provide('selectedToExport', selectedToExport);

const store = useStore();
const router = useRouter();

const currentPlace = computed(() => store.state.main.currentPlace);
const colortheme = computed(() => store.state.main.colortheme);
const colorthemes = computed(() => [
	{
		value: 'brown',
		title: store.state.main.t.i.inputs.colorthemeBrown,
	}, {
		value: 'blue',
		title: store.state.main.t.i.inputs.colorthemeBlue,
	}, {
		value: 'pink',
		title: store.state.main.t.i.inputs.colorthemePink,
	}, {
		value: 'green',
		title: store.state.main.t.i.inputs.colorthemeGreen,
	}, {
		value: 'pink-light',
		title: store.state.main.t.i.inputs.colorthemePinkLight,
	}, {
		value: 'blue-light',
		title: store.state.main.t.i.inputs.colorthemeBlueLight,
	}, {
		value: 'purple-light',
		title: store.state.main.t.i.inputs.colorthemePurpleLight,
	}, {
		value: 'green-light',
		title: store.state.main.t.i.inputs.colorthemeGreenLight,
	},
]);
provide('colorthemes', colorthemes);

emitter.on('logged', async () => {
	await store.dispatch('main/setUser');
	await store.dispatch('main/setPlaces', false);
	router.push({name: 'PlacesHome'});
});
emitter.on('toDB', (
	payload: Record<string, string | Array<Waypoint | Place | Image | Folder>>
) => {
	switch (payload.what) {
		case 'waypoints' :
			toDB({
				what: payload.what,
				data: payload.data
					? payload.data
					: Object.values(store.state.main.waypoints)
				,
			});
			break;
		case 'places' :
			toDB({
				what: payload.what,
				data: payload.data
					? payload.data
					: Object.values(store.state.main.places)
				,
			});
			break;
		case 'folders' :
			toDB({
				what: payload.what,
				data: payload.data
					? payload.data
					: Object.values(store.getters['main/treeFlat'])
				,
			});
			break;
		case undefined :
			toDB({
				what: 'waypoints',
				data: Object.values(store.state.main.waypoints),
			});
			toDB({
				what: 'places',
				data: Object.values(store.state.main.places),
			});
			toDB({
				what: 'folders',
				data: Object.values(store.getters['main/treeFlat']),
			});
			break;
		default :
			toDB(payload);
	}
});
emitter.on('homeToDB', (id: string) => {
	homeToDB(id);
});
emitter.on('toDBCompletely', () => {
	toDBCompletely();
});
emitter.on('getFolderById', (id: string) => {
	return store.getters['main/treeFlat'][id];
});
store.dispatch('main/changeLang', store.state.main.lang);

onMounted(() => {
	/*
	If the App is mounted during the session (for example, when the page
	is reloaded), the store state is restored from sessionStorage.
	*/
	if (sessionStorage.getItem('places-session')) {
		store.dispatch('main/replaceState', {
			state: JSON.parse(sessionStorage.getItem('places-store-state')).main,
		});
	}
	document.addEventListener('mousedown', () => {
		store.commit('main/setIdleTime', 0);
	}, false);
	document.addEventListener('keyup', () => {
		store.commit('main/setIdleTime', 0);
	}, false);
});

const toDB = async (
	payload: Record<string, string | Array<Waypoint | Place | Image | Folder>>
): Promise<void> => {
	if (store.state.main.user.testaccount) return;
	if (document.querySelector('.value_wrong')) {
		store.dispatch('main/setMessage', store.state.main.t.m.paged.incorrectFields);
		return;
	}
	payload.id = sessionStorage.getItem('places-userid');
	return axios.post(
		'/backend/set_' +
		(payload.what === 'waypoints' ? 'waypoints' : 'places') +
		'.php',
		payload
	)
		.then(response => {
			if (
				payload.what === 'waypoints' &&
				response.data.length > 0
			) {
			/*
			When adding new waypoints, the backend found existing
			waypoints with the same coordinates and returned them:
			no need to create new ones; or:
			When updating waypoints, backend found them common,
			created new waypoints with new values and returned them.
			Then we update the waypoint key of the corresponding places.
			*/
				for (const rec of response.data) {
					if (!store.state.main.waypoints[rec.waypoint.id]) {
						store.dispatch('main/addWaypoint', {
							'waypoint': rec.waypoint,
							'todb': false,
						});
					}
					store.dispatch(
						'change' +
							rec.waypointof.type.charAt(0).toUpperCase() +
							rec.waypointof.type.slice(1),
						{
							[rec.waypointof.type]:
								store.state
									[rec.waypointof.type + 's']
									[rec.waypointof.id]
							,
							change: {
								waypoint: rec.waypoint.id,
							}
						}
					);
				}
			} else {
				for (const fault of response.data) {
					switch (fault) {
						case 1 :
							store.dispatch('main/setMessage',
								store.state.main.t.m.popup.cannotSendDataToDb
							);
							return;
						case 2 :
							return;
						case 3 :
							store.dispatch('main/setMessage',
								store.state.main.t.m.popup.placesCountExceeded
							);
							return;
						case 4 :
							store.dispatch('main/setMessage',
								store.state.main.t.m.paged.foldersCountExceeded
							);
							return;
					}
				}
			}
			store.dispatch('main/savedToDB', payload);
			store.dispatch('main/setMessage',
				store.state.main.t.m.popup.savedToDb
			);
		})
		.catch(error => {
			store.dispatch('main/setMessage',
				store.state.main.t.m.popup.cannotSendDataToDb + ': ' + error
			);
		});
};
provide('toDB', toDB);

const toDBCompletely = async (): Promise<void> => {
	if (!store.state.main.user.testaccount) {
		const
			waypoints: Array<Waypoint> = [],
			places: Array<Place> = [],
			folders: Array<Folder> = []
		;
		for (const waypoint of Object.values(store.state.main.waypoints)) {
			if (
				(waypoint as Waypoint).added ||
				(waypoint as Waypoint).deleted ||
				(waypoint as Waypoint).updated
			) {
				waypoints.push(waypoint as Waypoint);
			}
		}
		for (const place of Object.values(store.state.main.places)) {
			if (
				(place as Place).added ||
				(place as Place).deleted ||
				(place as Place).updated
			) {
				places.push(place as Place);
			}
		}
		for (const folder of Object.values(store.getters['main/treeFlat'])) {
			if (
				(folder as Folder).added ||
				(folder as Folder).deleted ||
				(folder as Folder).updated
			) {
				folders.push(folder as Folder);
			}
		}
		await toDB({what: 'waypoints', data: waypoints});
		await toDB({what: 'places', data: places});
		await toDB({what: 'folders', data: folders});
	}
};
provide('toDBCompletely', toDBCompletely);

const homeToDB = async (id: string): Promise<void> => {
	if (!store.state.main.user.testaccount) {
		return axios.post(
			'/backend/set_home.php',
			{id: sessionStorage.getItem('places-userid'), data: id}
		)
			.then(() => {
				store.commit('main/setSaved', true);
				store.dispatch('main/setMessage',
					store.state.main.t.m.popup.savedToDb
				);
			})
			.catch(error => {
				store.dispatch('main/setMessage',
					store.state.main.t.m.popup.cannotSendDataToDb + ': ' + error
				);
			});
	}
};
const deleteImages = (images: Record<string, Image>, family?: boolean): void => {
	const data = new FormData();
	for (const [id, image] of Object.entries(images)) {
		data.append('file_' + id, image.file);
	}
	data.append('userid', store.state.main.user.id);
	if (!store.state.main.user.testaccount) {
		axios.post('/backend/delete.php', data)
			.then(() => {
				toDB({
					what: 'images_delete',
					data: Object.values(images),
				});
			});
	}
	store.commit('main/deleteImages', {images: images, family: family});
};
provide('deleteImages', deleteImages);

const exportPlaces = (places: Record<string, Place>, mime?: string): void => {
	const a = document.createElement('a');
	let content: string = '';
	switch (mime) {
		case 'application/gpx+xml' :
			a.download = 'places.gpx';
			a.dataset.downloadurl = ['application/gpx+xml', a.download, a.href].join(':');
			content =
					'<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
					+ '<gpx'
					+ ' version="1.1"'
					+ ' xmlns="http://www.topografix.com/GPX/1/1"'
					+ ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
					+ ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">'
			;
			for (const p of Object.values(places)) {
				content +=
					'<wpt lat="' +
					store.state.main.waypoints[p.waypoint].latitude +
					'" lon="' +
					store.state.main.waypoints[p.waypoint].longitude +
					'">'
				;
				content +=
					store.state.main.waypoints[p.waypoint].altitudecapability
						? (
							'<ele>' +
							store.state.main.waypoints[p.waypoint].altitudecapability +
							'</ele>'
						)
						: ''
					;
				content += p.name ? ('<name>' + p.name + '</name>') : '';
				content += p.description ? ('<desc>' + p.description + '</desc>') : '';
				content += p.link ? ('<link href="' + p.link + '"></link>') : '';
				content += p.time ? ('<time>' + p.time + '</time>') : '';
				content += '</wpt>';
			}
			content += '</gpx>';
			break;
		default :
			mime = 'application/json';
			a.download = 'places.json';
			a.dataset.downloadurl = ['application/json', a.download, a.href].join(':');
			const waypoints: Array<Waypoint> = [], folders: Array<Folder> = [];
			let parentFolder: Folder;
			for (const p of Object.values(places)) {
				waypoints.push(Object.assign({}, store.state.main.waypoints[p.waypoint]));
				if (!folders.find(f => f.id === p.folderid)) {
					parentFolder = store.getters['main/treeFlat'][p.folderid];
					while (
						parentFolder.id !== 'root' &&
						!folders.find(f => f.id === parentFolder.id)
					) {
						folders.push(Object.assign({}, parentFolder));
						parentFolder = store.getters['main/treeFlat'][parentFolder.parent];
					}
				}
			}
			const placesArray = [];
			for (const place of Object.values(places)) {
				placesArray.push(Object.assign({}, place));
				delete placesArray[placesArray.length - 1].type;
				delete placesArray[placesArray.length - 1].show;
				delete placesArray[placesArray.length - 1].added;
				delete placesArray[placesArray.length - 1].deleted;
				delete placesArray[placesArray.length - 1].updated;
				delete placesArray[placesArray.length - 1].geomark;
				delete placesArray[placesArray.length - 1].images;
			}
			for (const waypoint of Object.values(waypoints)) {
				delete waypoint.type;
				delete waypoint.show;
				delete waypoint.added;
				delete waypoint.deleted;
				delete waypoint.updated;
			}
			for (const folder of Object.values(folders)) {
				delete folder.type;
				delete folder.added;
				delete folder.deleted;
				delete folder.updated;
				delete folder.opened;
				delete folder.builded;
				delete folder.geomarks;
				delete folder.children;
			}
			content = JSON.stringify({
				places: placesArray,
				waypoints: waypoints,
				folders: folders,
			});
	}
	a.href = URL.createObjectURL(
		new Blob([content], {type: 'text/plain'})
	);
	a.click();
};
provide('exportPlaces', exportPlaces);

const handleDragStart = (event: Event): void => {
	store.commit('main/setIdleTime', 0);
	(event as any).dataTransfer.setData('text/plain', null);
	(draggingElement.value as Element) = (event.target as Element);
};
provide('handleDragStart', handleDragStart);

const handleDragEnter = (event: Event): void => {
	event.preventDefault();
	event.stopPropagation();
	if (
		!draggingElement.value ||
		(event.target as Node).nodeType !== 1 ||
		draggingElement.value === (event.target as Element)
	) return;
	const draggingElementPP = (draggingElement.value as Element)!.parentElement!.parentElement!;
	if (
		(event.target as any).dataset.folderButton !== undefined &&
		(
			(draggingElement.value as any).dataset.folderButton !== undefined ||
			(draggingElement.value as any).dataset.placeButton !== undefined
		)
	) {
		(event.target as Element).classList.add('highlighted');
	}
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(event.target as any).dataset.placeButtonDragenterAreaTop !== undefined &&
		(event.target as Element).parentElement !== draggingElement.value &&
		(event.target as Element).parentElement !== (draggingElement.value as Element).nextElementSibling
	) {
		(event.target as Element).classList.add('dragenter-area_top_border');
	} else if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(event.target as any).dataset.placeButtonDragenterAreaBottom !== undefined &&
		(event.target as Element).parentElement !== draggingElement.value &&
		(event.target as Element).parentElement !== (draggingElement.value as Element).previousElementSibling
	) {
		(event.target as Element).classList.add('dragenter-area_bottom_border');
	} else if (
		(draggingElement.value as any).dataset.folderButton !== undefined &&
		(event.target as any).dataset.folderDragenterAreaTop !== undefined &&
		(event.target as Element).parentElement !== draggingElementPP! &&
		(event.target as Element).parentElement !== draggingElementPP!.nextElementSibling
	) {
		(event.target as Element).classList.add('dragenter-area_top_border');
	} else if (
		(draggingElement.value as any).dataset.folderButton !== undefined &&
		(event.target as any).dataset.folderDragenterAreaBottom !== undefined &&
		(event.target as Element).parentElement !== draggingElementPP! &&
		(event.target as Element).parentElement !== draggingElementPP!.previousElementSibling
	) {
		(event.target as Element).classList.add('dragenter-area_bottom_border');
	} else if (
		currentPlace.value &&
		(draggingElement.value as any).dataset.image !== undefined &&
		(event.target as any).dataset.image !== undefined
	) {
		const ids: string[] = [];
		for (const id in currentPlace.value.images) {
			if (id === (draggingElement.value as Element).id) {
				ids.push(id);
			}
			if (id === (event.target as Element).id) {
				ids.push(id);
			}
			if (ids.length === 2) break;
		}
		store.dispatch('main/swapImages', {
			place: currentPlace.value,
			ids: ids,
		});
	}
};
provide('handleDragEnter', handleDragEnter);

const handleDragLeave = (event: Event): void => {
	if ((event.target as Element).nodeType === 1) {
		event.preventDefault();
		(event.target as Element).classList.remove('highlighted');
		(event.target as Element).classList.remove('dragenter-area_top_border');
		(event.target as Element).classList.remove('dragenter-area_bottom_border');
		(event.target as Element).classList.remove('dragenter-area_top_border');
		(event.target as Element).classList.remove('dragenter-area_bottom_border');
	}
};
provide('handleDragLeave', handleDragLeave);

const handleDragOver = (event: Event): void => {
	event.preventDefault();
};
provide('handleDragOver', handleDragOver);

const handleDrop = (event: Event): void => {
	if (draggingElement.value === null) return;
	event.preventDefault();
	event.stopPropagation();
	if (
		(event.target as Element).nodeType !== 1 ||
		draggingElement.value === (event.target as Element) &&
		(draggingElement.value as any).dataset.image === undefined
	) return;
	const
		targetSrt = Number(
			((event.target as Element).parentElement as Element).getAttribute('srt') ||
			(((event.target as Element).parentElement as Element).parentElement as Element).getAttribute('srt')
		) || 0,
		changes: Record<string, any> = {folder: {}, place: {}}
	;
	let newContainer: any;
	const change = () => {
		if (Object.keys(changes.place).length) {
			store.dispatch('main/changePlace', {
				place: store.state.main.places[
						(draggingElement.value as Element).id.match(/[\d\w]+$/)![0]
				],
				change: changes.place,
			});
		}
		if (Object.keys(changes.folder).length) {
			store.dispatch('main/moveFolder', {
				folderId: changes.folder.id,
				targetId: changes.folder.parent,
				srt: Number(changes.folder.srt) || 0,
				backup: false,
			});
		}
	};
	const cleanup = () => {
		event.target!.dispatchEvent(new Event('dragleave'));
		draggingElement.value = null;
	};
	// Place button was dropped on the folder link
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(event.target as any).dataset.folderButton !== undefined &&
		(event.target as Element).id.replace(/^.*-([^-]*)/, "$1") !==
			store.state.main.places[
				(draggingElement.value as Element).id
			].folderid
	) {
		newContainer =
			((event.target as Element).parentElement as Element).nextElementSibling!.nextElementSibling;
		if (newContainer.lastElementChild) {
			changes.place.srt = store.state.main.places[
				newContainer.lastElementChild.id
			].srt + 1;
		} else {
			changes.place.srt = 1;
		}
		changes.place.folderid =
			newContainer.id.replace(/^.*-([^-]*)/, "$1");
		change();
		cleanup();
		return;
	}
	/*
	Place button was dropped
	on the top sorting area of another place button
	*/
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(event.target as any).dataset.placeButtonDragenterAreaTop !== undefined &&
		(event.target as Element).parentElement !== (draggingElement.value as Element).nextElementSibling
	) {
		if (!((event.target as Element).parentElement as Element).previousElementSibling) {
			changes.place.srt = targetSrt / 2;
		} else {
			const targetPrevSrt = Number(
				((event.target as Element).parentElement as Element).previousElementSibling!
					.getAttribute('srt')
			) || 0;
			changes.place.srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
		}
		if ((draggingElement.value as Element).parentElement !== (((event.target as Element).parentElement as Element).parentElement as Element)) {
			changes.place.folderid = (((event.target as Element).parentElement as Element).parentElement as Element).id.match(/[\d\w]+$/)![0];
		}
		(event.target as Element).classList.remove('dragenter-area_top_border');
		change();
		cleanup();
		return;
	}
	/*
	Place button was dropped
	on the bottom sorting area of another place button
	*/
	if (
		(draggingElement.value as any).dataset.placeButton !== undefined &&
		(event.target as any).dataset.placeButtonDragenterAreaBottom !== undefined &&
		(event.target as Element).parentElement !== (draggingElement.value as Element).previousElementSibling
	) {
		if (!((event.target as Element).parentElement as Element).nextElementSibling) {
			changes.place.srt = targetSrt + 1;
		} else {
			const targetNextSrt = Number(
				((event.target as Element).parentElement as Element).nextElementSibling!.getAttribute('srt')
			) || 0;
			changes.place.srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
		}
		if ((draggingElement.value as Element).parentElement !== (((event.target as Element).parentElement as Element).parentElement as Element)) {
			changes.place.folderid = (((event.target as Element).parentElement as Element).parentElement as Element).id.match(/[\d\w]+$/)![0];
		}
		(event.target as Element).classList.remove('dragenter-area_bottom_border');
		change();
		cleanup();
		return;
	}
	// Folder link was dropped on the sorting area of another folder link
	if (
		(draggingElement.value as any).dataset.folderButton !== undefined &&
		(
			(event.target as any).dataset.folderDragenterAreaTop !== undefined ||
			(event.target as any).dataset.folderDragenterAreaBottom !== undefined
		) &&
		!!(changes.folder.id =
			(draggingElement.value as Element).id.replace(/^.*-([^-]*)/, "$1")
		) &&
		!!(changes.folder.parent =
			(((((event.target as Element).parentElement as Element).parentElement as Element).parentElement as Element).parentElement as Element)
				.id.replace(/^.*-([^-]*)/, "$1")
		) &&
		changes.folder.id !== changes.folder.parent &&
		!isParentInTree(
			store.state.main.tree,
			'children',
			changes.folder.id,
			changes.folder.parent
		)
	) {
		if (
			(event.target as any).dataset.folderDragenterAreaTop !== undefined &&
			(draggingElement.value as Element).parentElement!.parentElement !==
				((event.target as Element).parentElement as Element).previousElementSibling
		) {
			if (!((event.target as Element).parentElement as Element).previousElementSibling) {
				changes.folder.srt = targetSrt / 2;
			} else {
				const targetPrevSrt = Number(
					((event.target as Element).parentElement as Element).previousElementSibling!
						.getAttribute('srt')
				) || 0;
				changes.folder.srt =
					(targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
			}
		} else if (
			(event.target as any).dataset.folderDragenterAreaBottom !== undefined &&
			(draggingElement.value as Element).parentElement!.parentElement !==
				((event.target as Element).parentElement as Element).nextElementSibling
		) {
			if (!((event.target as Element).parentElement as Element).nextElementSibling) {
				changes.folder.srt = targetSrt + 1;
			} else {
				const targetNextSrt = Number(
					((event.target as Element).parentElement as Element).nextElementSibling!
						.getAttribute('srt')
				) || 0;
				changes.folder.srt =
					(targetNextSrt - targetSrt) / 2 + targetSrt;
			}
		}
		change();
		cleanup();
		return;
	}
	// Folder link dropped on another folder link
	if (
		(draggingElement.value as any).dataset.folderButton !== undefined &&
		(event.target as any).dataset.folderButton !== undefined &&
		!!(changes.folder.id =
			(draggingElement.value as Element).id.replace(/^.*-([^-]*)/, "$1")
		) &&
		!!(changes.folder.parent =
			(event.target as Element).id.replace(/^.*-([^-]*)/, "$1")
		) &&
		changes.folder.id !== changes.folder.parent && (
			!store.getters['main/treeFlat'][changes.folder.parent].children ||
			!store.getters['main/treeFlat'][changes.folder.parent].children[changes.folder.id]
		) &&
		!isParentInTree(
			store.state.main.tree,
			'children',
			changes.folder.id,
			changes.folder.parent
		)
	) {
		newContainer =
			((event.target as Element).parentElement as Element).nextElementSibling!.firstElementChild;
		if (newContainer && newContainer.lastElementChild) {
			changes.folder.srt = store.getters['main/treeFlat'][
				newContainer.lastElementChild.id.replace(/^.*-([^-]*)/, "$1")
			].srt + 1;
		} else {
			changes.folder.srt = 1;
		}
		change();
		cleanup();
		return;
	}
	// Image thumbnail dropped
	if ((draggingElement.value as any).dataset.image !== undefined) {
		store.dispatch('main/changePlace', {
			place: currentPlace.value,
			change: {updated: true},
		});
		toDB({what: 'places', data: [currentPlace.value]});
		cleanup();
		return;
	}
	cleanup();
};
provide('handleDrop', handleDrop);
</script>

<style lang="scss">
@import '@/assets/styles/style.scss';
@import '@/assets/styles/layout.scss';
</style>

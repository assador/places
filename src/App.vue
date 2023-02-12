<template>
	<div
		id="container"
		:class="'colortheme-' + colortheme"
	>
		<router-view />
	</div>
</template>

<script lang="ts">
import { ref, reactive, provide, defineComponent } from 'vue'
import axios from 'axios';
import store from '@/store';
import { mapState } from 'vuex'
import { emitter } from '@/shared/bus'
import { isParentInTree } from '@/shared/common';
import { Place, Image, Folder, Waypoint } from '@/store/types';

export default defineComponent({
	name: 'App',
	setup() {
		const currentPlaceCommon = ref(false);
		const selectedToExport = ref({});
		provide('currentPlaceCommon', currentPlaceCommon);
		provide('selectedToExport', selectedToExport);
		return {
			currentPlaceCommon,
			selectedToExport,
		};
	},
	data() {
		return {
			refreshing: false,
			draggingElement: null,
			foldersEditMode: false,
			idleTimeInterval: null,
		};
	},
	computed: {
		...mapState(['currentPlace', 'colortheme']),
		colorthemes(): Array<Record<string, string>> {
			return [{
				value: 'brown',
				title: this.$store.state.t.i.inputs.colorthemeBrown,
			}, {
				value: 'blue',
				title: this.$store.state.t.i.inputs.colorthemeBlue,
			}, {
				value: 'pink',
				title: this.$store.state.t.i.inputs.colorthemePink,
			}, {
				value: 'green',
				title: this.$store.state.t.i.inputs.colorthemeGreen,
			}, {
				value: 'pink-light',
				title: this.$store.state.t.i.inputs.colorthemePinkLight,
			}, {
				value: 'blue-light',
				title: this.$store.state.t.i.inputs.colorthemeBlueLight,
			}, {
				value: 'purple-light',
				title: this.$store.state.t.i.inputs.colorthemePurpleLight,
			}, {
				value: 'green-light',
				title: this.$store.state.t.i.inputs.colorthemeGreenLight,
			}];
		}
	},
	created() {
		emitter.on('logged', () => {
			this.$store.dispatch('setUser')
				.then(() => {
					this.$store.dispatch('setPlaces', false);
					this.$router.push({name: 'PlacesHome'});
				})
			;
		});
		emitter.on('toDB', (
			payload: Record<string, string | Array<Waypoint | Place | Image | Folder>>
		) => {
			switch (payload.what) {
				case 'waypoints' :
					this.toDB({
						what: payload.what,
						data: payload.data
							? payload.data
							: Object.values(this.$store.state.waypoints)
						,
					});
					break;
				case 'places' :
					this.toDB({
						what: payload.what,
						data: payload.data
							? payload.data
							: Object.values(this.$store.state.places)
						,
					});
					break;
				case 'folders' :
					this.toDB({
						what: payload.what,
						data: payload.data
							? payload.data
							: Object.values(this.$store.getters.treeFlat)
						,
					});
					break;
				case undefined :
					this.toDB({
						what: 'waypoints',
						data: Object.values(this.$store.state.waypoints),
					});
					this.toDB({
						what: 'places',
						data: Object.values(this.$store.state.places),
					});
					this.toDB({
						what: 'folders',
						data: Object.values(this.$store.getters.treeFlat),
					});
					break;
				default :
					this.toDB(payload);
			}
		});
		emitter.on('homeToDB', (id: string) => {
			this.homeToDB(id);
		});
		emitter.on('toDBCompletely', () => {
			this.toDBCompletely();
		});
		emitter.on('getFolderById', (id: string) => {
			return this.$store.getters.treeFlat[id];
		});
		this.$store.dispatch('changeLang', this.$store.state.lang);
	},
	mounted() {
		/*
		If the App is mounted during the session (for example, when the page
		is reloaded), the store state is restored from sessionStorage.
		*/
		if (sessionStorage.getItem('places-session')) {
			this.$store.dispatch('replaceState', {
				state: JSON.parse(sessionStorage.getItem('places-store-state')),
			});
		}
		document.addEventListener('mousedown', () => {
			this.$store.commit('setIdleTime', 0);
		}, false);
		document.addEventListener('keyup', () => {
			this.$store.commit('setIdleTime', 0);
		}, false);
	},
	methods: {
		setCurrentPlace(place: Place): void {
			emitter.emit('setCurrentPlace', {place});
		},
		toDB(
			payload: Record<string, string | Array<Waypoint | Place | Image | Folder>>
		): void {
			if (!this.$store.state.user.testaccount) {
				if (!document.querySelector('.value_wrong')) {
					payload.id = sessionStorage.getItem('places-userid');
					axios.post(
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
									if (!this.$store.state.waypoints[rec.waypoint.id]) {
										this.$store.dispatch('addWaypoint', {
											'waypoint': rec.waypoint,
											'todb': false,
										});
									}
									this.$store.dispatch(
										'change' +
											rec.waypointof.type.charAt(0).toUpperCase() +
											rec.waypointof.type.slice(1),
										{
											[rec.waypointof.type]:
												this.$store.state
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
											this.$store.dispatch('setMessage',
												this.$store.state.t.m.popup.cannotSendDataToDb
											);
											return;
										case 2 :
											return;
										case 3 :
											this.$store.dispatch('setMessage',
												this.$store.state.t.m.popup.placesCountExceeded
											);
											return;
										case 4 :
											this.$store.dispatch('setMessage',
												this.$store.state.t.m.paged.foldersCountExceeded
											);
											return;
									}
								}
							}
							this.$store.dispatch('savedToDB', payload);
							this.$store.dispatch('setMessage',
								this.$store.state.t.m.popup.savedToDb
							);
						})
						.catch(error => {
							this.$store.dispatch('setMessage',
								this.$store.state.t.m.popup.cannotSendDataToDb + ': ' + error
							);
						});
				} else {
					this.$store.dispatch('setMessage',
						this.$store.state.t.m.paged.incorrectFields
					);
				}
			}
		},
		homeToDB(id: string): void {
			if (!this.$store.state.user.testaccount) {
				axios.post(
					'/backend/set_home.php',
					{id: sessionStorage.getItem('places-userid'), data: id}
				)
					.then(() => {
						this.$store.commit('setSaved', true);
						this.$store.dispatch('setMessage',
							this.$store.state.t.m.popup.savedToDb
						);
					})
					.catch(error => {
						this.$store.dispatch('setMessage',
							this.$store.state.t.m.popup.cannotSendDataToDb + ': ' + error
						);
					});
			}
		},
		toDBCompletely(): void {
			if (!this.$store.state.user.testaccount) {
				const
					waypoints: Array<Waypoint> = [],
					places: Array<Place> = [],
					folders: Array<Folder> = []
				;
				for (const waypoint of Object.values(this.$store.state.waypoints)) {
					if (
						(waypoint as Waypoint).added ||
						(waypoint as Waypoint).deleted ||
						(waypoint as Waypoint).updated
					) {
						waypoints.push(waypoint as Waypoint);
					}
				}
				for (const place of Object.values(this.$store.state.places)) {
					if (
						(place as Place).added ||
						(place as Place).deleted ||
						(place as Place).updated
					) {
						places.push(place as Place);
					}
				}
				for (const folder of Object.values(this.$store.getters.treeFlat)) {
					if (
						(folder as Folder).added ||
						(folder as Folder).deleted ||
						(folder as Folder).updated
					) {
						folders.push(folder as Folder);
					}
				}
				this.toDB({what: 'waypoints', data: waypoints});
				this.toDB({what: 'places', data: places});
				this.toDB({what: 'folders', data: folders});
			}
		},
		deleteImages(images: Record<string, Image>, family?: boolean): void {
			const data = new FormData();
			for (const [id, image] of Object.entries(images)) {
				data.append('file_' + id, image.file);
			}
			data.append('userid', this.$store.state.user.id);
			if (!this.$store.state.user.testaccount) {
				axios.post('/backend/delete.php', data)
					.then(() => {
						this.toDB({
							what: 'images_delete',
							data: Object.values(images),
						});
					});
			}
			this.$store.commit('deleteImages', {images: images, family: family});
		},
		exportPlaces(places: Record<string, Place>, mime: string): void {
			const a = document.createElement('a');
			let content: string;
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
							this.$store.state.waypoints[p.waypoint].latitude +
							'" lon="' +
							this.$store.state.waypoints[p.waypoint].longitude +
							'">'
						;
						content +=
							this.$store.state.waypoints[p.waypoint].altitudecapability
								? (
									'<ele>' +
									this.$store.state.waypoints[p.waypoint].altitudecapability +
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
						waypoints.push(Object.assign({}, this.$store.state.waypoints[p.waypoint]));
						if (!folders.find(f => f.id === p.folderid)) {
							parentFolder = this.$store.getters.treeFlat[p.folderid];
							while (
								parentFolder.id !== 'root' &&
								!folders.find(f => f.id === parentFolder.id)
							) {
								folders.push(Object.assign({}, parentFolder));
								parentFolder = this.$store.getters.treeFlat[parentFolder.parent];
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
		},
		handleDragStart(event: Event): void {
			this.$store.commit('setIdleTime', 0);
			(event as any).dataTransfer.setData('text/plain', null);
			(this.draggingElement as Element) = (event.target as Element);
		},
		handleDragEnter(event: Event): void {
			event.preventDefault();
			event.stopPropagation();
			if (
				!this.draggingElement ||
				(event.target as Node).nodeType !== 1 ||
				this.draggingElement === (event.target as Element)
			) return;
			const draggingElementPP = (this.draggingElement as Element)!.parentElement!.parentElement!;
			if (
				(event.target as any).dataset.folderButton !== undefined &&
				(
					(this.draggingElement as any).dataset.folderButton !== undefined ||
					(this.draggingElement as any).dataset.placeButton !== undefined
				)
			) {
				(event.target as Element).classList.add('highlighted');
			}
			if (
				(this.draggingElement as any).dataset.placeButton !== undefined &&
				(event.target as any).dataset.placeButtonDragenterAreaTop !== undefined &&
				(event.target as Element).parentElement !== this.draggingElement &&
				(event.target as Element).parentElement !== (this.draggingElement as Element).nextElementSibling
			) {
				(event.target as Element).classList.add('dragenter-area_top_border');
			} else if (
				(this.draggingElement as any).dataset.placeButton !== undefined &&
				(event.target as any).dataset.placeButtonDragenterAreaBottom !== undefined &&
				(event.target as Element).parentElement !== this.draggingElement &&
				(event.target as Element).parentElement !== (this.draggingElement as Element).previousElementSibling
			) {
				(event.target as Element).classList.add('dragenter-area_bottom_border');
			} else if (
				(this.draggingElement as any).dataset.folderButton !== undefined &&
				(event.target as any).dataset.folderDragenterAreaTop !== undefined &&
				(event.target as Element).parentElement !== draggingElementPP! &&
				(event.target as Element).parentElement !== draggingElementPP!.nextElementSibling
			) {
				(event.target as Element).classList.add('dragenter-area_top_border');
			} else if (
				(this.draggingElement as any).dataset.folderButton !== undefined &&
				(event.target as any).dataset.folderDragenterAreaBottom !== undefined &&
				(event.target as Element).parentElement !== draggingElementPP! &&
				(event.target as Element).parentElement !== draggingElementPP!.previousElementSibling
			) {
				(event.target as Element).classList.add('dragenter-area_bottom_border');
			} else if (
				this.currentPlace &&
				(this.draggingElement as any).dataset.image !== undefined &&
				(event.target as any).dataset.image !== undefined
			) {
				const ids: string[] = [];
				for (const id in this.currentPlace.images) {
					if (id === (this.draggingElement as Element).id) {
						ids.push(id);
					}
					if (id === (event.target as Element).id) {
						ids.push(id);
					}
					if (ids.length === 2) break;
				}
				this.$store.dispatch('swapImages', {
					place: this.currentPlace,
					ids: ids,
				});
			}
		},
		handleDragLeave(event: Event): void {
			if ((event.target as Element).nodeType === 1) {
				event.preventDefault();
				(event.target as Element).classList.remove('highlighted');
				(event.target as Element).classList.remove('dragenter-area_top_border');
				(event.target as Element).classList.remove('dragenter-area_bottom_border');
				(event.target as Element).classList.remove('dragenter-area_top_border');
				(event.target as Element).classList.remove('dragenter-area_bottom_border');
			}
		},
		handleDragOver(event: Event): void {
			event.preventDefault();
		},
		handleDrop(event: Event): void {
			if (this.draggingElement === null) return;
			event.preventDefault();
			event.stopPropagation();
			if (
				(event.target as Element).nodeType !== 1 ||
				this.draggingElement === (event.target as Element) &&
				(this.draggingElement as any).dataset.image === undefined
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
					this.$store.dispatch('changePlace', {
						place: this.$store.state.places[
								(this.draggingElement as Element).id.match(/[\d\w]+$/)![0]
						],
						change: changes.place,
					});
				}
				if (Object.keys(changes.folder).length) {
					this.$store.dispatch('moveFolder', {
						folderId: changes.folder.id,
						targetId: changes.folder.parent,
						srt: Number(changes.folder.srt) || 0,
						backup: false,
					});
				}
			};
			const cleanup = () => {
				event.target!.dispatchEvent(new Event('dragleave'));
				this.draggingElement = null;
			};
			// Place button was dropped on the folder link
			if (
				(this.draggingElement as any).dataset.placeButton !== undefined &&
				(event.target as any).dataset.folderButton !== undefined &&
				(event.target as Element).id.replace(/^.*-([^-]*)/, "$1") !==
					this.$store.state.places[
						(this.draggingElement as Element).id
					].folderid
			) {
				newContainer =
					((event.target as Element).parentElement as Element).nextElementSibling!.nextElementSibling;
				if (newContainer.lastElementChild) {
					changes.place.srt = this.$store.state.places[
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
				(this.draggingElement as any).dataset.placeButton !== undefined &&
				(event.target as any).dataset.placeButtonDragenterAreaTop !== undefined &&
				(event.target as Element).parentElement !== (this.draggingElement as Element).nextElementSibling
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
				if ((this.draggingElement as Element).parentElement !== (((event.target as Element).parentElement as Element).parentElement as Element)) {
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
				(this.draggingElement as any).dataset.placeButton !== undefined &&
				(event.target as any).dataset.placeButtonDragenterAreaBottom !== undefined &&
				(event.target as Element).parentElement !== (this.draggingElement as Element).previousElementSibling
			) {
				if (!((event.target as Element).parentElement as Element).nextElementSibling) {
					changes.place.srt = targetSrt + 1;
				} else {
					const targetNextSrt = Number(
						((event.target as Element).parentElement as Element).nextElementSibling!.getAttribute('srt')
					) || 0;
					changes.place.srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
				}
				if ((this.draggingElement as Element).parentElement !== (((event.target as Element).parentElement as Element).parentElement as Element)) {
					changes.place.folderid = (((event.target as Element).parentElement as Element).parentElement as Element).id.match(/[\d\w]+$/)![0];
				}
				(event.target as Element).classList.remove('dragenter-area_bottom_border');
				change();
				cleanup();
				return;
			}
			// Folder link was dropped on the sorting area of another folder link
			if (
				(this.draggingElement as any).dataset.folderButton !== undefined &&
				(
					(event.target as any).dataset.folderDragenterAreaTop !== undefined ||
					(event.target as any).dataset.folderDragenterAreaBottom !== undefined
				) &&
				!!(changes.folder.id =
					(this.draggingElement as Element).id.replace(/^.*-([^-]*)/, "$1")
				) &&
				!!(changes.folder.parent =
					(((((event.target as Element).parentElement as Element).parentElement as Element).parentElement as Element).parentElement as Element)
						.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				changes.folder.id !== changes.folder.parent &&
				!isParentInTree(
					this.$store.state.tree,
					'children',
					changes.folder.id,
					changes.folder.parent
				)
			) {
				if (
					(event.target as any).dataset.folderDragenterAreaTop !== undefined &&
					(this.draggingElement as Element).parentElement!.parentElement !==
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
					(this.draggingElement as Element).parentElement!.parentElement !==
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
				(this.draggingElement as any).dataset.folderButton !== undefined &&
				(event.target as any).dataset.folderButton !== undefined &&
				!!(changes.folder.id =
					(this.draggingElement as Element).id.replace(/^.*-([^-]*)/, "$1")
				) &&
				!!(changes.folder.parent =
					(event.target as Element).id.replace(/^.*-([^-]*)/, "$1")
				) &&
				changes.folder.id !== changes.folder.parent && (
					!this.$store.getters.treeFlat[changes.folder.parent].children ||
					!this.$store.getters.treeFlat[changes.folder.parent].children[changes.folder.id]
				) &&
				!isParentInTree(
					this.$store.state.tree,
					'children',
					changes.folder.id,
					changes.folder.parent
				)
			) {
				newContainer =
					((event.target as Element).parentElement as Element).nextElementSibling!.firstElementChild;
				if (newContainer && newContainer.lastElementChild) {
					changes.folder.srt = this.$store.getters.treeFlat[
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
			if ((this.draggingElement as any).dataset.image !== undefined) {
				this.$store.dispatch('changePlace', {
					place: this.currentPlace,
					change: {updated: true},
				});
				this.toDB({what: 'places', data: [this.currentPlace]});
				cleanup();
				return;
			}
			cleanup();
		},
	},
});
</script>

<style lang="scss">
@import '@/assets/styles/style.scss';
@import '@/assets/styles/layout.scss';
</style>

import Vue from 'vue';
import App from '@/App.vue';
import '@/registerServiceWorker';
import router from '@/router';
import store from '@/store';
import { mapState } from 'vuex';
import { bus } from '@/shared/bus';
import { commonFunctions } from '@/shared/common';
import { Place, Image, Folder, Waypoint } from '@/store/types';
import axios from 'axios';
import '@/css/style.css';
import '@/css/layout.css';

Vue.config.productionTip = false;
//Vue.config.devtools = true;

new Vue({
	data: {
		refreshing: false,
		draggingElement: null as Element | null,
		foldersEditMode: false,
		selectedToExport: {},
		currentPlaceCommon: false,
		idleTimeInterval: null,
		activeMapIndex: 0,
		maps: [{
			name: 'OpenStreetMap',
			component: 'MapOpenStreetMap',
		}, {
			name: 'Яндекс.Карты',
			component: 'MapYandex',
		}],
	},
	computed: {
		...mapState(['currentPlace']),
	},
	created() {
		bus.$on('logged', () => {
			this.$store.dispatch('setUser')
				.then(() => {
					this.$store.dispatch('setPlaces', false);
					this.$router.push({name: 'Home'});
				})
			;
		});
		bus.$on('toDB', (
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
		bus.$on('homeToDB', (id: string) => {
			this.homeToDB(id);
		});
		bus.$on('toDBCompletely', () => {
			this.toDBCompletely();
		});
		bus.$on('getFolderById', (id: string) => {
			return this.$store.getters.treeFlat[id];
		});
	},
	methods: {
		changeMap(index: number): void {
			this.activeMapIndex = index;
		},
		setCurrentPlace(place: Place): void {
			bus.$emit('setCurrentPlace', {place});
		},
		getAbout: async (): Promise<void> => {
			return await axios.get('/about.html')
				.then(response => response.data)
				.catch(error => '<p>Не могу найти справку. ' + error + '</p>');
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
												'Не могу внести данные в базу данных.'
											);
											return;
										case 2 :
											return;
										case 3 :
											this.$store.dispatch('setMessage', `
												Превышено максимально допустимое для вашей
												текущей роли количство мест.
											`);
											return;
										case 4 :
											this.$store.dispatch('setMessage', `
												Превышено максимально допустимое для вашей
												текущей роли количство папок.
											`);
											return;
									}
								}
							}
							this.$store.dispatch('savedToDB', payload);
							this.$store.dispatch('setMessage',
								'Изменения сохранены в базе данных.'
							);
						})
						.catch(error => {
							this.$store.dispatch('setMessage',
								'Не могу внести данные в базу данных: ' + error
							);
						});
				} else {
					this.$store.dispatch('setMessage',
						'Некоторые поля заполнены некорректно.'
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
							'Изменения сохранены в базе данных.'
						);
					})
					.catch(error => {
						this.$store.dispatch('setMessage',
							'Не могу внести данные в базу данных: ' + error
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
				for (
					const waypoint of
					<Array<Waypoint>>Object.values(this.$store.state.waypoints)
				) {
					if (waypoint.added || waypoint.deleted || waypoint.updated) {
						waypoints.push(waypoint);
					}
				}
				for (
					const place of
					<Array<Place>>Object.values(this.$store.state.places)
				) {
					if (place.added || place.deleted || place.updated) {
						places.push(place);
					}
				}
				for (
					const folder of
					<Array<Folder>>Object.values(this.$store.getters.treeFlat)
				) {
					if (folder.added || folder.deleted || folder.updated) {
						folders.push(folder);
					}
				}
				this.toDB({what: 'waypoints', data: waypoints});
				this.toDB({what: 'places', data: places});
				this.toDB({what: 'folders', data: folders});
			}
		},
		deleteImages(images: Record<string, Image>, family?: boolean): void {
			const data = new FormData();
			for (const id in images) {
				data.append('file_' + id, images[id].file);
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
						waypoints.push(this.$store.state.waypoints[p.waypoint]);
						if (!folders.find(f => f.id === p.folderid)) {
							parentFolder = this.$store.getters.treeFlat[p.folderid];
							while (
								parentFolder.id !== 'root' &&
								!folders.find(f => f.id === parentFolder.id)
							) {
								folders.push(parentFolder);
								parentFolder = this.$store.getters.treeFlat[parentFolder.parent];
							}
						}
					}
					const placesArray = [];
					for (const id in places) {
						placesArray.push(Object.assign({}, places[id]));
						delete placesArray[placesArray.length - 1].type;
						delete placesArray[placesArray.length - 1].show;
						delete placesArray[placesArray.length - 1].added;
						delete placesArray[placesArray.length - 1].deleted;
						delete placesArray[placesArray.length - 1].updated;
						delete placesArray[placesArray.length - 1].geomark;
						delete placesArray[placesArray.length - 1].images;
					}
					for (let i = waypoints.length - 1; i >= 0; i--) {
						waypoints[i] = Object.assign({}, waypoints[i]);
						delete waypoints[i].type;
						delete waypoints[i].show;
						delete waypoints[i].added;
						delete waypoints[i].deleted;
						delete waypoints[i].updated;
					}
					for (let i = folders.length - 1; i >= 0; i--) {
						folders[i] = Object.assign({}, folders[i]);
						delete folders[i].type;
						delete folders[i].added;
						delete folders[i].deleted;
						delete folders[i].updated;
						delete folders[i].opened;
						delete folders[i].builded;
						delete folders[i].geomarks;
						delete folders[i].children;
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
				),
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
						srt: changes.folder.srt,
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
					);
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
					);
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
				!commonFunctions.isParentInTree(
					this.$store.getters.tree,
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
						);
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
						);
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
				!commonFunctions.isParentInTree(
					this.$store.getters.tree,
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
	router,
	store,
	render: h => h(App)
}).$mount('#app');

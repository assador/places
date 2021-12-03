import Vue from 'vue';
import App from '@/App.vue';
import '@/registerServiceWorker';
import router from '@/router';
import store from '@/store';
import { mapState } from 'vuex';
import { bus } from '@/shared/bus';
import { commonFunctions } from '@/shared/common';
import { Place, Image, Folder } from '@/store/types';
import axios from 'axios';
import '@/css/style.css';
import '@/css/layout.css';

Vue.config.productionTip = false;
//Vue.config.devtools = true;

new Vue({
	data: {
		refreshing: false,
		draggingElement: null as Element | null,
		foldersPlain: {} as Record<string, Folder>,
		foldersEditMode: false,
		selectedToExport: [],
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
		...mapState(['currentPlace', 'currentPlaceIndex']),
		folderRoot(): Folder {
			return {
				id: 'root',
				type: 'folder',
				name: 'Мои места',
				children: this.$store.state.folders,
				opened: true,
				geomarks: 1,
				parent: null,
				srt: 0,
				builded: true,
				added: true,
				deleted: false,
				updated: false,
				userid: '',
			}
		},
	},
	watch: {
		folderRoot: {
			deep: true,
			immediate: true,
			handler(folderRoot) {
				const foldersPlain = {};
				commonFunctions.treeToLivePlain(folderRoot, 'children', foldersPlain);
				this.foldersPlain = foldersPlain;
			},
		},
	},
	mounted() {
		bus.$on('logged', () => {
			this.$store.dispatch('setUser')
				.then(() => {
					this.$store.dispatch('setPlaces', false);
					this.$router.push({name: 'Home'});
				})
			;
		});
		bus.$on('toDB', (payload: Record<string, any>) => {
			switch (payload.what) {
				case 'places' :
					this.toDB({
						what: payload.what,
						data: payload.data
							? payload.data
							: this.$store.state.places
						,
					});
					break;
				case 'folders' :
					if (payload.data) {
						this.toDB({
							what: payload.what,
							data: payload.data,
						});
					} else {
						const plainFolders: Array<Folder> = [];
						commonFunctions.treeToPlain(this.folderRoot, 'children', plainFolders);
						this.toDB({
							what: payload.what,
							data: plainFolders,
						});
					}
					break;
				case undefined :
					this.toDB({
						what: 'places',
						data: this.$store.state.places,
					});
					const plainFolders: Array<Folder> = [];
					commonFunctions.treeToPlain(this.folderRoot, 'children', plainFolders);
					this.toDB({
						what: 'folders',
						data: plainFolders,
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
			return this.foldersPlain[id];
		});
	},
	methods: {
		changeMap(index: number): void {
			this.activeMapIndex = index;
		},
		setCurrentPlace(place: Place, common = false): void {
			bus.$emit('setCurrentPlace', {place, common});
		},
		getAbout: async (): Promise<void> => {
			return await axios.get('/about.html')
				.then(response => response.data)
				.catch(error => '<p>Не могу найти справку. ' + error + '</p>');
		},
		toDB(payload: Record<string, any>): void {
			if (!this.$store.state.user.testaccount) {
				if (!document.querySelector('.value_wrong')) {
					payload.id = sessionStorage.getItem('places-userid');
					axios.post('/backend/set_places.php', payload)
						.then(response => {
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
							this.$store.dispatch('savedToDB');
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
				const plainFolders: Array<Folder> = [];
				commonFunctions.treeToPlain(
					this.folderRoot,
					'children',
					plainFolders
				);
				axios.post(
					'/backend/set_completely.php',
					{
						id: sessionStorage.getItem('places-userid'),
						data: {
							places: this.$store.state.places,
							folders: plainFolders,
						},
					}
				)
					.then(response => {
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
						this.$store.dispatch('savedToDB');
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
				this.$store.dispatch("setMessage", `
					Вы авторизовались под тестовым аккаунтом;
					невозможны сохранение изменений в базу данных
					и загрузка файлов, в том числе фотографий.
				`);
			}
		},
		deleteImages(images: Array<Image>, family?: boolean): void {
			const data = new FormData();
			for (let i = 0; i < images.length; i++) {
				data.append('file_' + i, images[i].file);
			}
			data.append('userid', this.$store.state.user.id);
			if (!this.$store.state.user.testaccount) {
				axios.post('/backend/delete.php', data)
					.then(() => {
						this.toDB({
							what: 'images_delete',
							data: images,
						});
					});
			}
			this.$store.commit('deleteImages', {images: images, family: family});
		},
		exportPlaces(places: Array<Place>, mime: string): void {
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
					for (const p of places) {
						content += '<wpt lat="' + p.latitude + '" lon="' + p.longitude + '">';
						content += p.name ? ('<name>' + p.name + '</name>') : '';
						content += p.description ? ('<description>' + p.description + '</description>') : '';
						content += p.link ? ('<link href="' + p.link + '"></link>') : '';
						content += p.altitudecapability ? ('<ele>' + p.altitudecapability + '</ele>') : '';
						content += p.time ? ('<time>' + p.time + '</time>') : '';
						content += '</wpt>';
					}
					content += '</gpx>';
					break;
				default :
					mime = 'application/json';
					a.download = 'places.json';
					a.dataset.downloadurl = ['application/json', a.download, a.href].join(':');
					const foldersPlain: Array<Folder> = [];
					let folderId, parentFolder, parentFound, folders = [];
					commonFunctions.treeToPlain(
						{'children': this.$store.state.folders}, 'children', foldersPlain
					);
					for (const p of places) {
						if (p.folderid === folderId) {continue;}
						folderId = p.folderid;
						for (let i = 0; i < foldersPlain.length; i++) {
							if (foldersPlain[i].id === p.folderid) {
								parentFolder = foldersPlain[i];
								parentFolder.builded = false;
								folders.push(foldersPlain.splice(i, 1)[0]);
								do {
									for (let j = 0; j < foldersPlain.length; j++) {
										parentFound = false;
										if (foldersPlain[j].id === parentFolder.parent) {
											parentFolder = foldersPlain[j];
											parentFolder.builded = false;
											folders.push(foldersPlain.splice(j, 1)[0]);
											parentFound = true;
											break;
										}
									}
								} while (parentFolder.parent !== 'root' && parentFound);
								break;
							}
						}
					}
					folders = commonFunctions.plainToTree(folders);
					content = JSON.stringify({
						places: places,
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
				const indexes: number[] = [];
				for (let i = 0; i < this.currentPlace.images.length; i++) {
					if (
						this.currentPlace.images[i].id ===
							(this.draggingElement as Element).id
					) {
						indexes.push(i);
					}
					if (
						this.currentPlace.images[i].id ===
							(event.target as Element).id
					) {
						indexes.push(i);
					}
					if (indexes.length === 2) break;
				}
				this.$store.dispatch('swapImages', {
					place: this.currentPlace,
					indexes: indexes,
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
				if (Object.keys(changes.place).length > 0) {
					this.$store.dispatch('changePlace', {
						place: this.$store.state.places.find(
							(p: Place) => p.id ===
								(this.draggingElement as Element).id.match(/[\d\w]+$/)![0]
						),
						change: changes.place,
					});
				}
				if (Object.keys(changes.folder).length > 0) {
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
					this.$store.state.places.find(
						(p: Place) => p.id === (this.draggingElement as Element).id
					).folderid
			) {
				newContainer =
					((event.target as Element).parentElement as Element).nextElementSibling!.nextElementSibling;
				if (newContainer.lastElementChild) {
					changes.place.srt = this.$store.state.places.find(
						(p: Place) => p.id === newContainer.lastElementChild.id
					).srt + 1;
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
			 * Place button was dropped
			 * on the top sorting area of another place button
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
			 * Place button was dropped
			 * on the bottom sorting area of another place button
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
					{children: this.$store.state.folders},
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
				changes.folder.id !== changes.folder.parent &&
				!commonFunctions.isParentInTree(
					{children: this.$store.state.folders},
					'children',
					changes.folder.id,
					changes.folder.parent
				)
			) {
				newContainer =
					((event.target as Element).parentElement as Element).nextElementSibling!.firstElementChild;
				if (newContainer && newContainer.lastElementChild) {
					changes.folder.srt = this.foldersPlain[
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
				bus.$emit('toDB', {what: 'places', data: [this.currentPlace]});
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

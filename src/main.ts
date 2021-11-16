import Vue from 'vue'
import App from '@/App.vue'
import '@/registerServiceWorker'
import router from '@/router'
import store from '@/store'
import { mapState } from 'vuex'
import { constants } from '@/shared/constants'
import { bus } from '@/shared/bus'
import { commonFunctions } from '@/shared/common'
import axios from 'axios'
import '@/css/style.css'
import '@/css/layout.css'

Vue.config.productionTip = false
//Vue.config.devtools = true;

new Vue({
	data: {
		refreshing: false,
		draggingElement: null,
		foldersPlain: {},
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
		}, {
			name: 'Навител.Карты',
			component: 'MapNavitel',
		}],
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
		folderRoot() {
			return {
				id: 'root',
				type: 'folder',
				name: 'Мои места',
				children: this.$store.state.folders,
				opened: true,
				geomarks: 1,
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
				.then(response => {
					this.$store.dispatch('setPlaces', false);
					this.$router.push({name: 'Home'});
				})
				.catch(error => {
					console.log(error);
				});
		});
		bus.$on('toDB', payload => {
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
						const plainFolders = [];
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
					const plainFolders = [];
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
		bus.$on('homeToDB', id => {
			this.homeToDB(id);
		});
		bus.$on('toDBCompletely', () => {
			this.toDBCompletely();
		});
		bus.$on('getFolderById', (id) => {
			return this.foldersPlain[id];
		});
	},
	methods: {
		changeMap(index) {
			this.activeMapIndex = index;
		},
		setCurrentPlace(place, common = false) {
			bus.$emit('setCurrentPlace', {place, common});
		},
		getAbout: async () => {
			return await axios.get('/about.html')
				.then(response => response.data)
				.catch(error => '<p>Не могу найти справку. ' + error + '</p>');
		},
		toDB(payload) {
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
								'Не могу внести данные в базу данных.'
							);
						});
				} else {
					this.$store.dispatch('setMessage',
						'Некоторые поля заполнены некорректно.'
					);
				}
			}
		},
		homeToDB(id) {
			if (!this.$store.state.user.testaccount) {
				axios.post(
					'/backend/set_home.php',
					{id: sessionStorage.getItem('places-userid'), data: id}
				)
					.then(response => {
						this.$store.commit('setSaved', true);
						this.$store.dispatch('setMessage',
							'Изменения сохранены в базе данных.'
						);
					})
					.catch(error => {
						this.$store.dispatch('setMessage',
							'Не могу внести данные в базу данных.'
						);
					});
			}
		},
		toDBCompletely() {
			if (!this.$store.state.user.testaccount) {
				const plainFolders = [];
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
							'Не могу внести данные в базу данных.'
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
		deleteImages(images, family?) {
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
		exportPlaces(places, mime) {
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
					const foldersPlain = [];
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
		handleDragStart(event) {
			this.$store.commit('setIdleTime', 0);
			event.dataTransfer.setData('text/plain', null);
			this.draggingElement = event.target;
		},
		handleDragEnter(event) {
			event.preventDefault();
			event.stopPropagation();
			if (
				event.target.nodeType !== 1 ||
				this.draggingElement === event.target
			) return;
			const draggingElementPP = this.draggingElement.parentNode.parentNode;
			if (
				event.target.dataset.folderButton !== undefined &&
				(
					this.draggingElement.dataset.folderButton !== undefined ||
					this.draggingElement.dataset.placeButton !== undefined
				)
			) {
				event.target.classList.add('highlighted');
			}
			if (
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaTop !== undefined &&
				event.target.parentNode !== this.draggingElement &&
				event.target.parentNode !== this.draggingElement.nextElementSibling
			) {
				event.target.classList.add('dragenter-area_top_border');
			} else if (
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaBottom !== undefined &&
				event.target.parentNode !== this.draggingElement &&
				event.target.parentNode !== this.draggingElement.previousElementSibling
			) {
				event.target.classList.add('dragenter-area_bottom_border');
			} else if (
				this.draggingElement.dataset.folderButton !== undefined &&
				event.target.dataset.folderDragenterAreaTop !== undefined &&
				event.target.parentNode !== draggingElementPP &&
				event.target.parentNode !== draggingElementPP.nextElementSibling
			) {
				event.target.classList.add('dragenter-area_top_border');
			} else if (
				this.draggingElement.dataset.folderButton !== undefined &&
				event.target.dataset.folderDragenterAreaBottom !== undefined &&
				event.target.parentNode !== draggingElementPP &&
				event.target.parentNode !== draggingElementPP.previousElementSibling
			) {
				event.target.classList.add('dragenter-area_bottom_border');
			} else if (
				this.currentPlace &&
				this.draggingElement.dataset.image !== undefined &&
				event.target.dataset.image !== undefined
			) {
				const indexes: number[] = [];
				for (let i = 0; i < this.currentPlace.images.length; i++) {
					if (
						this.currentPlace.images[i].id ===
							this.draggingElement.id
					) {
						indexes.push(i);
					}
					if (
						this.currentPlace.images[i].id ===
							event.target.id
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
		handleDragLeave(event) {
			if (event.target.nodeType === 1) {
				event.preventDefault();
				event.target.classList.remove('highlighted');
				event.target.classList.remove('dragenter-area_top_border');
				event.target.classList.remove('dragenter-area_bottom_border');
				event.target.classList.remove('dragenter-area_top_border');
				event.target.classList.remove('dragenter-area_bottom_border');
			}
		},
		handleDragOver(event) {
			event.preventDefault();
		},
		handleDrop(event) {
			event.preventDefault();
			event.stopPropagation();
			if (
				event.target.nodeType !== 1 ||
				this.draggingElement === event.target &&
				this.draggingElement.dataset.image === undefined
			) return;
			const
				targetSrt = Number(
					event.target.parentNode.getAttribute('srt') ||
					event.target.parentNode.parentNode.getAttribute('srt')
				),
				changes: any = {folder: {}, place: {}}
			;
			let newContainer: any;
			const change = () => {
				if (Object.keys(changes.place).length > 0) {
					this.$store.dispatch('changePlace', {
						place: this.$store.state.places.find(
							p => p.id === this.draggingElement.id
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
				event.target.dispatchEvent(new Event('dragleave'));
				this.draggingElement = null;
			};
			// Place button was dropped on the folder link
			if (
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.folderButton !== undefined &&
				event.target.id.replace(/^.*-([^-]*)/, "$1") !==
					this.$store.state.places.find(
						p => p.id === this.draggingElement.id
					).folderid
			) {
				newContainer =
					event.target.parentNode.nextElementSibling.nextElementSibling;
				if (newContainer.lastElementChild) {
					changes.place.srt = this.$store.state.places.find(
						p => p.id === newContainer.lastElementChild.id
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
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaTop !== undefined &&
				event.target.parentNode !== this.draggingElement.nextElementSibling
			) {
				if (!event.target.parentNode.previousElementSibling) {
					changes.place.srt = targetSrt / 2;
				} else {
					const targetPrevSrt = Number(
						event.target.parentNode.previousElementSibling
							.getAttribute('srt')
					);
					changes.place.srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
				}
				if (this.draggingElement.parentNode !== event.target.parentNode.parentNode) {
					changes.place.folderid = event.target.parentNode.parentNode.id;
				}
				event.target.classList.remove('dragenter-area_top_border');
				change();
				cleanup();
				return;
			}
			/*
			 * Place button was dropped
			 * on the bottom sorting area of another place button
			 */
			if (
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaBottom !== undefined &&
				event.target.parentNode !== this.draggingElement.previousElementSibling
			) {
				if (!event.target.parentNode.nextElementSibling) {
					changes.place.srt = targetSrt + 1;
				} else {
					const targetNextSrt = Number(
						event.target.parentNode.nextElementSibling.getAttribute('srt')
					);
					changes.place.srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
				}
				if (this.draggingElement.parentNode !== event.target.parentNode.parentNode) {
					changes.place.folderid = event.target.parentNode.parentNode.id;
				}
				event.target.classList.remove('dragenter-area_bottom_border');
				change();
				cleanup();
				return;
			}
			// Folder link was dropped on the sorting area of another folder link
			if (
				this.draggingElement.dataset.folderButton !== undefined &&
				(
					event.target.dataset.folderDragenterAreaTop !== undefined ||
					event.target.dataset.folderDragenterAreaBottom !== undefined
				) &&
				!!(changes.folder.id =
					this.draggingElement.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				!!(changes.folder.parent =
					event.target.parentNode.parentNode.parentNode.parentNode
						.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				changes.folder.id !== changes.folder.parent &&
				!commonFunctions.isParentInTree(
					{children: this.$store.state.folders},
					'children',
					changes.folder.id,
					changes.folder.parent,
					null
				)
			) {
				if (
					event.target.dataset.folderDragenterAreaTop !== undefined &&
					this.draggingElement.parentNode.parentNode !==
						event.target.parentNode.previousElementSibling
				) {
					if (!event.target.parentNode.previousElementSibling) {
						changes.folder.srt = targetSrt / 2;
					} else {
						const targetPrevSrt = Number(
							event.target.parentNode.previousElementSibling
								.getAttribute('srt')
						);
						changes.folder.srt =
							(targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
					}
				} else if (
					event.target.dataset.folderDragenterAreaBottom !== undefined &&
					this.draggingElement.parentNode.parentNode !==
						event.target.parentNode.nextElementSibling
				) {
					if (!event.target.parentNode.nextElementSibling) {
						changes.folder.srt = targetSrt + 1;
					} else {
						const targetNextSrt = Number(
							event.target.parentNode.nextElementSibling
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
				this.draggingElement.dataset.folderButton !== undefined &&
				event.target.dataset.folderButton !== undefined &&
				!!(changes.folder.id =
					this.draggingElement.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				!!(changes.folder.parent =
					event.target.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				changes.folder.id !== changes.folder.parent &&
				!commonFunctions.isParentInTree(
					{children: this.$store.state.folders},
					'children',
					changes.folder.id,
					changes.folder.parent,
					null
				)
			) {
				newContainer =
					event.target.parentNode.nextElementSibling.firstElementChild;
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
			if (this.draggingElement.dataset.image !== undefined) {
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
}).$mount('#app')

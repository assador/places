import Vue from "vue"
import Vuex from "vuex"
import App from "./App.vue"
import { store } from "./store.js"
import { constants } from "./shared/constants.js"
import { bus } from "./shared/bus.js"
import { mapGetters } from "vuex"
import axios from "axios"
import './css/style.css'
import './css/layout.css'

Vue.use(Vuex);

//Vue.config.devtools = true;

let app = new Vue({
	data: {
		refreshing: false,
		popupComponent: "popuptext",
		popuped: "disappear",
		popupData: {},
		needToUpdate: false,
		needToUpdateFolders: false,
		draggingElement: null,
		folderRoot: null,
		foldersEditMode: false,
		selectedToExport: [],
	},
	mounted() {
		bus.$on("toDB", payload => {
			let plain = [];
			switch(payload.what) {
				case "places" :
					this.toDB("places", JSON.stringify(this.$store.state.places));
					break;
				case "folders" :
					treeToPlain(this.folderRoot, "children", plain);
					this.toDB("folders", JSON.stringify(plain));
					break;
				case undefined :
					this.toDB("places", JSON.stringify(this.$store.state.places));
					treeToPlain(this.folderRoot, "children", plain);
					this.toDB("folders", JSON.stringify(plain));
					break;
				default :
					this.toDB(payload.what, payload.data);
			}
		});
		bus.$on("homeToDB", place => {
			this.homeToDB(place);
		});
		bus.$on("toDBCompletely", () => {
			this.toDBCompletely();
		});
	},
	computed: {
		setCurrentPlace: (place, common = false) => function(place, common = false) {
			bus.$emit("setCurrentPlace", {place, common});
		},
		showPopup: (opts, event) => function(opts, event) {
			event.stopPropagation();
			this.$store.commit("setIdleTime", 0);
			switch(opts.type) {
				case "text" :
					this.popupData = opts.data;
					this.popupComponent = "popuptext";
					break;
				case "image" :
					this.popupData = opts.data;
					this.popupComponent = "popupimage";
					break;
				case "folder" :
					this.popupData = opts.data;
					this.popupComponent = "popupfolder";
					break;
				case "folderDelete" :
					this.popupData = opts.data;
					this.popupComponent = "popupfolderdelete";
					break;
				case "export" :
					this.popupData = opts.data;
					this.popupComponent = "popupexport";
					break;
				case "delete" :
					this.popupComponent = "popupdelete";
					break;
				default :
					this.popupComponent = null;
			}
			if(!opts["show"]) {
				this.popupComponent = null;
			}
			this.popuped = opts["show"] ? "appear" : "disappear";
		},
		showAbout: event => function(event) {
			let aboutRequest = new XMLHttpRequest();
			aboutRequest.open("GET", "/about.htm", true);
			aboutRequest.onreadystatechange = (event) => {
				if(aboutRequest.readyState == 4) {
					if(aboutRequest.status == 200) {
						this.showPopup({
							show: true,
							type: "text",
							data:
								JSON.stringify(aboutRequest.responseText)
									.replace(/^\s*\"/, "")
									.replace(/\"\s*$/, "")
									.replace(/(?:\\(?=")|\\(?=\/)|\\t|\\n)/gi, "")
							,
						}, event);
					} else {
						this.$store.dispatch("setMessage", "Не могу найти справку");
					}
				}
			};
			aboutRequest.setRequestHeader("Content-type", "application/json");
			aboutRequest.send();
		},
		toDB: (todo, data) => function(todo, data) {
			if(!this.$store.state.user.testaccount) {
				if(!document.querySelector(".value_wrong")) {
					let placesRequest = new XMLHttpRequest();
					placesRequest.open("POST", "/backend/set_places.php", true);
					placesRequest.onreadystatechange = (event) => {
						if(placesRequest.readyState == 4) {
							if(placesRequest.status == 200) {
								this.$store.commit("setSaved", true);
								this.$store.dispatch("setMessage",
									"Изменения сохранены в базе данных"
								);
							} else {
								this.$store.dispatch("setMessage",
									"Не могу внести данные в БД"
								);
							}
						}
					};
					placesRequest.setRequestHeader(
						"Content-type", "application/x-www-form-urlencoded"
					);
					placesRequest.send(
						"id=" + sessionStorage.getItem("places-userid") +
						"&todo=" + (typeof(todo) !== "undefined"
							? todo
							: "places"
						) +
						"&data=" + (typeof(data) !== "undefined"
							? data
							: JSON.stringify(this.$store.state.places)
						)
					);
				} else {
					this.$store.dispatch("setMessage",
						"Некоторые поля заполнены некорректно"
					);
				}
			}
		},
		homeToDB: (place) => function(place) {
			if(!this.$store.state.user.testaccount) {
				let homeRequest = new XMLHttpRequest();
				homeRequest.open("POST", "/backend/set_home.php", true);
				homeRequest.onreadystatechange = (event) => {
					if(homeRequest.readyState == 4) {
						if(homeRequest.status == 200) {
							this.$store.commit("setSaved", true);
							this.$store.dispatch("setMessage",
								"Изменения сохранены в базе данных"
							);
						} else {
							this.$store.dispatch("setMessage",
								"Не могу внести данные в БД"
							);
						}
					}
				};
				homeRequest.setRequestHeader(
					"Content-type", "application/x-www-form-urlencoded"
				);
				homeRequest.send(
					"id=" + sessionStorage.getItem("places-userid") +
					"&data=" + place.id
				);
			}
		},
		toDBCompletely: () => function() {
			if(!this.$store.state.user.testaccount) {
				let placesRequest = new XMLHttpRequest();
				placesRequest.open("POST", "/backend/set_completely.php", true);
				placesRequest.onreadystatechange = (event) => {
					if(placesRequest.readyState == 4) {
						if(placesRequest.status == 200) {
							this.$store.commit("setSaved", true);
							this.$store.dispatch("setMessage",
								"Изменения сохранены в базе данных"
							);
						} else {
							this.$store.dispatch("setMessage",
								"Не могу внести данные в БД"
							);
						}
					}
				};
				placesRequest.setRequestHeader(
					"Content-type", "application/x-www-form-urlencoded"
				);
				let plainFolders = [];
				treeToPlain(
					this.folderRoot,
					"children",
					plainFolders
				);
				placesRequest.send(
					"id=" + sessionStorage.getItem("places-userid") +
					"&data=" + (JSON.stringify({
						"places": this.$store.state.places,
						"folders": plainFolders,
					}))
				);
			}
		},
		deleteFiles: (inarray, files) => function(inarray, files) {
			let data = new FormData();
			let place = {};
			let indexOfImage = -1;
			if(!files) {
				files = inarray;
			}
			for(let i = 0; i < files.length; i++) {
				data.append("file_" + i, files[i].file);
				if(files[i].placeid) {
					if(files[i].placeid != place.id) {
						for(let y = 0; y < this.$store.state.places.length; y++) {
							place = this.$store.state.places[y];
							indexOfImage = place.images.indexOf(files[i]);
							break;
						}
					}
					if(indexOfImage > -1) {
						this.$store.commit("changePlace", {
							place: place,
							change: {
								images: place.images.splice(indexOfImage, 1),
								updated: true,
							},
							backup: !place.deleted,
						});
					}
					indexOfImage = -1;
				}
			}
			data.append("userid", this.$store.state.user.id);
			if(!this.$store.state.user.testaccount) {
				axios.post("/backend/delete.php", data)
					.then(response => {
						this.toDB("images_delete", JSON.stringify(files));
					}
				);
			}
		},
		exportPlaces: (places, mime) => function(places, mime) {
			let content, a = document.createElement("a");
			switch(mime) {
				case "application/gpx+xml" :
					a.download = "places.gpx";
					a.dataset.downloadurl = ["application/gpx+xml", a.download, a.href].join(":");
					content =
						'<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
						+ '<gpx'
						+ ' version="1.1"'
						+ ' xmlns="http://www.topografix.com/GPX/1/1"'
						+ ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
						+ ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">'
					;
					for(let p of places) {
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
					mime = "application/json";
					a.download = "places.json";
					a.dataset.downloadurl = ["application/json", a.download, a.href].join(":");
					content = JSON.stringify({
						places: this.$store.state.places,
						folders: this.$store.state.folders,
					});
			}
			a.href = window.URL.createObjectURL(
				new Blob([content], {type: "text/plain"})
			);
			let e = document.createEvent("MouseEvents");
			e.initEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(e);
		},
	},
	methods: {
		handleDragStart(event) {
			this.$store.commit("setIdleTime", 0);
			event.dataTransfer.setData("text/plain", null);
			this.draggingElement = event.target;
		},
		handleDragEnter(event) {
			event.preventDefault();
			event.stopPropagation();
			if(
				event.target.nodeType !== 1 ||
				this.draggingElement === event.target
			) return;
			let draggingElementPP = this.draggingElement.parentNode.parentNode;
			if(
				event.target.dataset.folderButton !== undefined &&
				(
					this.draggingElement.dataset.folderButton !== undefined ||
					this.draggingElement.dataset.placeButton !== undefined
				)
			) {
				event.target.classList.add("highlighted");
			}
			if(
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaTop !== undefined &&
				event.target.parentNode !== this.draggingElement &&
				event.target.parentNode !== this.draggingElement.nextElementSibling
			) {
				event.target.classList.add("dragenter-area_top_border");
			} else if(
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaBottom !== undefined &&
				event.target.parentNode !== this.draggingElement &&
				event.target.parentNode !== this.draggingElement.previousElementSibling
			) {
				event.target.classList.add("dragenter-area_bottom_border");
			} else if(
				this.draggingElement.dataset.folderButton !== undefined &&
				event.target.dataset.folderDragenterAreaTop !== undefined &&
				event.target.parentNode !== draggingElementPP &&
				event.target.parentNode !== draggingElementPP.nextElementSibling
			) {
				event.target.classList.add("dragenter-area_top_border");
			} else if(
				this.draggingElement.dataset.folderButton !== undefined &&
				event.target.dataset.folderDragenterAreaBottom !== undefined &&
				event.target.parentNode !== draggingElementPP &&
				event.target.parentNode !== draggingElementPP.previousElementSibling
			) {
				event.target.classList.add("dragenter-area_bottom_border");
			} else if(
				this.$store.state.currentPlace &&
				this.draggingElement.dataset.image !== undefined &&
				event.target.dataset.image !== undefined
			) {
				let indexes = [];
				for(let i = 0; i < this.$store.state.currentPlace.images.length; i++) {
					if(
						this.$store.state.currentPlace.images[i].id ===
							this.draggingElement.id
					) {
						indexes.push(i);
					}
					if(
						this.$store.state.currentPlace.images[i].id ===
							event.target.id
					) {
						indexes.push(i);
					}
					if(indexes.length === 2) break;
				}
				this.$store.commit("swapValues", {
					parent: this.$store.state.currentPlace.images,
					indexes: indexes,
					values: ["srt"],
					backup: false,
				});
				this.needToUpdate = true;
			}
		},
		handleDragLeave(event) {
			if(event.target.nodeType === 1) {
				event.preventDefault();
				event.target.classList.remove("highlighted");
				event.target.classList.remove("dragenter-area_top_border");
				event.target.classList.remove("dragenter-area_bottom_border");
				event.target.classList.remove("dragenter-area_top_border");
				event.target.classList.remove("dragenter-area_bottom_border");
			}
		},
		handleDragOver(event) {
			event.preventDefault();
		},
		handleDrop(event, element) {
			event.preventDefault();
			event.stopPropagation();
			if(
				event.target.nodeType !== 1 ||
				this.draggingElement === event.target
			) return;
			let
				newPlaceButtonContainer,
				targetSrt = Number(
					event.target.parentNode.getAttribute("srt") ||
					event.target.parentNode.parentNode.getAttribute("srt")
				),
				changes = {folder: {}, place: {}}
			;
			let change = () => {
				if(Object.keys(changes.place).length > 0) {
					this.$store.commit("changePlace", {
						place: this.$store.state.places.find(
							p => p.id === this.draggingElement.id
						),
						change: changes.place,
						backup: false,
					});
					this.needToUpdate = true;
				}
				if(Object.keys(changes.folder).length > 0) {
					this.$store.dispatch("moveFolder", {
						folderId: changes.folder.id,
						targetId: changes.folder.parent,
						srt: changes.folder.srt,
						backup: false,
					});
					this.needToUpdateFolders = true;
				}
			};
			let update = () => {
				if(this.needToUpdate || this.needToUpdateFolders) {
					this.$store.commit("backupState");
					if(this.$store.state.inUndoRedo) {
						bus.$emit("toDBCompletely");
					} else if(this.needToUpdate) {
						bus.$emit("toDB", "places");
						this.needToUpdate = false;
					} else if(this.needToUpdateFolders) {
						bus.$emit("toDB", "folders");
						this.needToUpdateFolders = false;
					}
				}
			};
			let cleanup = () => {
				event.target.dispatchEvent(new Event("dragleave"));
				this.draggingElement = null;
			};
			// Place button was dropped on the folder link
			if(
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.folderButton !== undefined &&
				event.target.id.replace(/^.*-([^-]*)/, "$1") !==
					this.$store.state.places.find(
						p => p.id === this.draggingElement.id
					).folderid
			) {
				newPlaceButtonContainer =
					event.target.parentNode.nextElementSibling.nextElementSibling;
				if(newPlaceButtonContainer.lastElementChild) {
					changes.place.srt = this.$store.state.places.find(
						p => p.id === newPlaceButtonContainer.lastElementChild.id
					).srt + 1;
				} else {
					changes.place.srt = 1;
				}
				changes.place.folderid =
					newPlaceButtonContainer.id.replace(/^.*-([^-]*)/, "$1");
				change();
				update();
				cleanup();
				return;
			}
			/*
			 * Place button was dropped
			 * on the top sorting area of another place button
			 */
			if(
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaTop !== undefined &&
				event.target.parentNode !== this.draggingElement.nextElementSibling
			) {
				if(!event.target.parentNode.previousElementSibling) {
					changes.place.srt = targetSrt / 2;
				} else {
					let targetPrevSrt = Number(
						event.target.parentNode.previousElementSibling
						.getAttribute("srt")
					);
					changes.place.srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
				}
				if(this.draggingElement.parentNode !== event.target.parentNode.parentNode) {
					changes.place.folderid = event.target.parentNode.parentNode.id;
				}
				event.target.classList.remove("dragenter-area_top_border");
				change();
				update();
				cleanup();
				return;
			}
			/*
			 * Place button was dropped
			 * on the bottom sorting area of another place button
			 */
			if(
				this.draggingElement.dataset.placeButton !== undefined &&
				event.target.dataset.placeButtonDragenterAreaBottom !== undefined &&
				event.target.parentNode !== this.draggingElement.previousElementSibling
			) {
				if(!event.target.parentNode.nextElementSibling) {
					changes.place.srt = targetSrt + 1;
				} else {
					let targetNextSrt = Number(
						event.target.parentNode.nextElementSibling
						.getAttribute("srt")
					);
					changes.place.srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
				}
				if(this.draggingElement.parentNode !== event.target.parentNode.parentNode) {
					changes.place.folderid = event.target.parentNode.parentNode.id;
				}
				event.target.classList.remove("dragenter-area_bottom_border");
				change();
				update();
				cleanup();
				return;
			}
			// Folder link was dropped on the sorting area of another folder link
			if(
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
				!isParentInTree(
					{children: this.$store.state.folders},
					"children",
					changes.folder.id,
					changes.folder.parent
				)
			) {
				if(
					event.target.dataset.folderDragenterAreaTop !== undefined &&
					this.draggingElement.parentNode.parentNode !==
						event.target.parentNode.previousElementSibling
				) {
					if(!event.target.parentNode.previousElementSibling) {
						changes.folder.srt = targetSrt / 2;
					} else {
						let targetPrevSrt = Number(
							event.target.parentNode.previousElementSibling
							.getAttribute("srt")
						);
						changes.folder.srt =
							(targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
					}
				} else if(
					event.target.dataset.folderDragenterAreaBottom !== undefined &&
					this.draggingElement.parentNode.parentNode !==
						event.target.parentNode.nextElementSibling
				) {
					if(!event.target.parentNode.nextElementSibling) {
						changes.folder.srt = targetSrt + 1;
					} else {
						let targetNextSrt = Number(
							event.target.parentNode.nextElementSibling
							.getAttribute("srt")
						);
						changes.folder.srt =
							(targetNextSrt - targetSrt) / 2 + targetSrt;
					}
				}
				change();
				update();
				cleanup();
				return;
			}
			// Folder link dropped on another folder link
			if(
				this.draggingElement.dataset.folderButton !== undefined &&
				event.target.dataset.folderButton !== undefined &&
				!!(changes.folder.id =
					this.draggingElement.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				!!(changes.folder.parent =
					event.target.id.replace(/^.*-([^-]*)/, "$1")
				) &&
				changes.folder.id !== changes.folder.parent &&
				!isParentInTree(
					{children: this.$store.state.folders},
					"children",
					changes.folder.id,
					changes.folder.parent
				)
			) {
				change();
				update();
				cleanup();
				return;
			}
			cleanup();
		},
	},
	store,
	el: "#app",
	render: h => h(App),
});

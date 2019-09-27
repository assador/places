import Vue from "vue"
import Vuex from "vuex"
import App from "./App.vue"
import {store} from "./store.js"
import {bus} from "./shared/bus.js"
import {mapGetters} from "vuex"

Vue.use(Vuex);

//Vue.config.devtools = true;

let app = new Vue({
	data: {
		popupComponent: "popuptext",
		popuped: "disappear",
		popupData: {},
		needToUpdate: false,
		needToUpdateFolders: false,
		draggingElement: null,
		foldersEditMode: false,
	},
	computed: {
		...mapGetters(["getIndexById"]),
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
				case "delete" :
					this.popupComponent = "popupdelete";
					break;
			}
			this.popuped = opts["show"] ? "appear" : "disappear";
		},
		showAbout: (event) => function(event) {
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
	},
	methods: {
		handleDragStart: function(event) {
			this.$store.commit("setIdleTime", 0);
			event.dataTransfer.setData("text/plain", null);
			this.draggingElement = event.target;
		},
		handleDragEnter: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(
				this.draggingElement !== event.target
				&& event.target.classList
			) {
				// Place button passes over sorting areas of another place button
				if(
					this.draggingElement !== event.target.parentNode
					&& this.draggingElement.classList.contains("place-button")
					&& event.target.classList.contains("place-button__dragenter-area")
					&& !(
						this.draggingElement.nextElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_top")
					)
					&& !(
						this.draggingElement.previousElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_bottom")
					)
				) {
					if(event.target.classList.contains("place-button__dragenter-area_top")) {
						event.target.classList.add("dragenter-area_top_border");
					}
					if(event.target.classList.contains("place-button__dragenter-area_bottom")) {
						event.target.classList.add("dragenter-area_bottom_border");
					}
				}
				// Folder link passes over sorting areas of another folder link
				if(
					this.draggingElement !== event.target.parentNode.firstElementChild
					&& this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("places-menu-folder__dragenter-area")
					&& !(
						this.draggingElement.parentNode.nextElementSibling === event.target.parentNode
						&& event.target.classList.contains("places-menu-folder__dragenter-area_top")
					)
					&& !(
						this.draggingElement.parentNode.previousElementSibling === event.target.parentNode
						&& event.target.classList.contains("places-menu-folder__dragenter-area_bottom")
					)
				) {
					if(event.target.classList.contains("places-menu-folder__dragenter-area_top")) {
						event.target.classList.add("dragenter-area_top_border");
					}
					if(event.target.classList.contains("places-menu-folder__dragenter-area_bottom")) {
						event.target.classList.add("dragenter-area_bottom_border");
					}
				}
				// Photo image passes over another photo image
				if(
					this.draggingElement.classList.contains("place-image")
					&& event.target.classList.contains("place-image")
				) {
					this.$store.commit("swapValues", {
						parent: this.$store.state.currentPlace.images,
						indexes: [
							this.getIndexById({
								parent: this.$store.state.currentPlace.images,
								id: this.draggingElement.id,
							}),
							this.getIndexById({
								parent: this.$store.state.currentPlace.images,
								id: event.target.id,
							}),
						],
						values: ["srt"],
						backup: false,
					});
					this.needToUpdate = true;
				}
			}
		},
		handleDragLeave: function(event) {
			event.preventDefault();
			if(event.target.classList) {
				// Place button leaves sorting areas of another place button
				if(event.target.classList.contains("place-button__dragenter-area")) {
					event.target.classList.remove("dragenter-area_top_border");
					event.target.classList.remove("dragenter-area_bottom_border");
				}
				// Folder link leaves sorting areas of another folder link
				if(event.target.classList.contains("places-menu-folder__dragenter-area")) {
					event.target.classList.remove("dragenter-area_top_border");
					event.target.classList.remove("dragenter-area_bottom_border");
				}
			}
		},
		handleDragOver: function(event) {
			event.preventDefault();
			// Folder link or place button pass over a folder link
			for(let f of document.getElementsByClassName("folder-button")) {
				f.classList.remove("folder-button_parent");
			}
			if(
				(
					this.draggingElement.classList.contains("folder-button")
					|| this.draggingElement.classList.contains("place-button")
				)
				&& event.target.classList.contains("folder-button")
			) {
				event.target.classList.add("folder-button_parent");
			}
		},
		handleDrop: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(
				this.draggingElement !== event.target
				&& event.target.classList
			) {
				let
					srt = null,
					targetSrt = Number(event.target.parentNode.getAttribute("srt"))
				;
				// Place button dropped on folder list item
				if(
					this.draggingElement.classList.contains("place-button")
					&& event.target.parentNode.classList.contains("places-menu-folder")
				) {
					let container;
					event.target.parentNode.querySelectorAll(".places-menu-item")
						.forEach(function(c) {
							if(c.parentNode === event.target.parentNode) {
								container = c;
								return;
							}
						}
					);
					if(container) {
						let srt;
						if(container.children.length > 0) {
							srt =
								this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: container.children[container.children.length - 1].id,
								})].srt + 1
							;
						} else {
							srt = 1;
						}
						this.$store.commit("changePlace", {
							place:
								this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: this.draggingElement.id,
								})]
							,
							change: {
								folderid:
									container.id === "places-menu-item-root"
										? null
										: container.id
								,
								srt: srt,
							},
							backup: false,
						});
						this.needToUpdate = true;
					}
				}
				// Place button dropped on sorting areas of another place button
				if(
					this.draggingElement !== event.target.parentNode
					&& this.draggingElement.classList.contains("place-button")
					&& event.target.classList.contains("place-button__dragenter-area")
					&& !(
						this.draggingElement.nextElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_top")
					)
					&& !(
						this.draggingElement.previousElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_bottom")
					)
				) {
					for(let e of document.getElementsByClassName("place-button__dragenter-area")) {
						e.classList.remove("dragenter-area_top_border");
						e.classList.remove("dragenter-area_bottom_border");
					}
					let
						targetPrev = event.target.parentNode.previousElementSibling,
						targetNext = event.target.parentNode.nextElementSibling
					;
					if(event.target.classList.contains("place-button__dragenter-area_top")) {
						if(!targetPrev) {
							srt = targetSrt / 2;
						} else if(targetPrev !== this.draggingElement) {
							let targetPrevSrt = Number(targetPrev.getAttribute("srt"));
							srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
						}
					}
					if(event.target.classList.contains("place-button__dragenter-area_bottom")) {
						if(!targetNext) {
							srt = targetSrt + 1;
						} else if(targetNext !== this.draggingElement) {
							let targetNextSrt = Number(targetNext.getAttribute("srt"));
							srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
						}
					}
					if(srt !== null) {
						this.$store.commit("changePlace", {
							place: this.$store.state.places[this.getIndexById({
								parent: this.$store.state.places,
								id: this.draggingElement.id,
							})],
							change: {
								folderid: this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: event.target.parentNode.id,
								})].folderid,
								srt: srt,
							},
							backup: false,
						});
						this.needToUpdate = true;
					}
				}
				// Folder link dropped on a folder link
				if(event.target.classList.contains("folder-button")) {
					for(let e of document.getElementsByClassName("folder-button_parent")) {
						e.classList.remove("folder-button_parent");
					}
				}
				if(event.target.classList.contains("places-menu-folder__dragenter-area")) {
					for(let e of document.getElementsByClassName("places-menu-folder__dragenter-area")) {
						e.classList.remove("dragenter-area_top_border");
						e.classList.remove("dragenter-area_bottom_border");
					}
				}
				// Folder link dropped on sorting areas of another folder link
				if(
					this.draggingElement !== event.target.parentNode.firstElementChild
					&& this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("places-menu-folder__dragenter-area")
					&& !isParentInTree(
						{children: this.$store.state.folders},
						"children",
						this.draggingElement.id.substr(24),
						event.target.parentNode.id.substr(19)
					)
				) {
					let
						srt = null,
						targetSrt = Number(event.target.parentNode.firstElementChild.getAttribute("srt")),
						targetPrev = event.target.parentNode.previousElementSibling,
						targetNext = event.target.parentNode.nextElementSibling
					;
					if(event.target.classList.contains("places-menu-folder__dragenter-area_top")) {
						if(!targetPrev) {
							srt = targetSrt / 2;
						} else if(targetPrev !== this.draggingElement.parentNode) {
							let targetPrevSrt = Number(targetPrev.firstElementChild.getAttribute("srt"));
							srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
						}
					}
					if(event.target.classList.contains("places-menu-folder__dragenter-area_bottom")) {
						if(!targetNext) {
							srt = targetSrt + 1;
						} else if(targetNext !== this.draggingElement.parentNode) {
							let targetNextSrt = Number(targetNext.firstElementChild.getAttribute("srt"));
							srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
						}
					}
					if(srt !== null) {
						this.$store.dispatch("moveFolder", {
							folderId: this.draggingElement.id.substr(24),
							targetId: event.target.parentNode.parentNode.parentNode.id.substr(19),
							srt: srt,
							backup: false,
						});
						this.needToUpdateFolders = true;
					}
				}
				// Folder link dropped on another folder link
				if(
					this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("folder-button")
					&& !this.draggingElement.parentNode.contains(event.target.parentNode.parentNode)
					&& !isParentInTree(
						{children: this.$store.state.folders},
						"children",
						this.draggingElement.id.substr(24),
						event.target.id.substr(24)
					)
				) {
					this.$store.dispatch("moveFolder", {
						folderId: this.draggingElement.id.substr(24),
						targetId: event.target.id.substr(24),
						backup: false,
					});
					this.needToUpdateFolders = true;
				}
			}
			this.draggingElement = null;
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
		},
	},
	store,
	el: "#app",
	render: h => h(App),
});

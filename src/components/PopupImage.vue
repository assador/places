<template>
	<div>
		<img
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + dataprop.file"
			:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedbig + dataprop.file + '\''"
			title="Следующая"
			@click="showImage(1, $event);"
		>
		<a
			href="javascript:void(0);"
			class="prev"
			@click="showImage(-1, $event);"
		>◀</a>
		<a
			href="javascript:void(0);"
			class="next"
			@click="showImage(1, $event);"
		>▶</a>
		<a
			href="javascript:void(0);"
			class="close"
			@click="$root.showPopup({show: false}, $event);"
		>×</a>
	</div>
</template>

<script>
import { constants } from "../shared/constants.ts"
export default {
	props: ["data", "currentPlace"],
	data() {
		return {
			constants: constants,
			dataprop: this.data,
		}
	},
	watch: {
		data: {
			deep: true,
			immediate: true,
			handler(data) {
				this.dataprop = data;
			},
		},
	},
	mounted() {
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		showImage(step, event) {
			this.$store.commit("setIdleTime", 0);
			event.stopPropagation();
			if (this.currentPlace && this.currentPlace.images.length > 0) {
				let currentIndex = this.currentPlace.images.indexOf(this.dataprop);
				if (currentIndex > -1) {
					let ImagesLength = this.currentPlace.images.length;
					currentIndex = (currentIndex + step) % ImagesLength + (
						(currentIndex + step) % ImagesLength < 0 ? ImagesLength: 0
					);
					this.dataprop = this.currentPlace.images[currentIndex];
				}
			}
		},
		keyup(event) {
			switch (constants.shortcuts[event.keyCode]) {
				case 'close' :
					this.$root.showPopup({show: false}, event);
					break;
				case 'left' :
					if (this.$root.popupComponent === 'popupimage') {
						this.showImage(-1, event);
					}
					break;
				case 'right' :
					if (this.$root.popupComponent === 'popupimage') {
						this.showImage(1, event);
					}
					break;
			}
		},
	},
}
</script>

<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<img
			v-if="image"
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + image.file"
			:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedbig + image.file + '\''"
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
			@click="close($event)"
		>×</a>
	</div>
</template>

<script>
import { constants } from "../shared/constants.ts"
export default {
	props: ["imageId"],
	data() {
		return {
			constants: constants,
			popuped: false,
			images: null,
			image: undefined,
		}
	},
	watch: {
		imageId() {
			this.defineVars();
		},
	},
	mounted() {
		this.popuped = true;
		this.defineVars();
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeUpdate() {
		this.popuped = true;
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		close(event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		defineVars() {
			for (let place of this.$store.state.places) {
				this.image = place.images.find(image => image.id === this.imageId);
				if (this.image) {
					this.images = place.images;
					return;
				}
			}
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		showImage(step, event) {
			event.stopPropagation();
				let currentIndex = this.images.indexOf(this.image);
				if (currentIndex > -1) {
					let ImagesLength = this.images.length;
					currentIndex = (currentIndex + step) % ImagesLength + (
						(currentIndex + step) % ImagesLength < 0 ? ImagesLength: 0
					);
					this.$router.push({
						name: 'HomeImages',
						params: {imageId: this.images[currentIndex].id}
					}).catch(() => {});
				}
		},
		keyup(event) {
			switch (constants.shortcuts[event.keyCode]) {
				case 'close' :
					this.close();
					break;
				case 'left' :
					this.showImage(-1, event);
					break;
				case 'right' :
					this.showImage(1, event);
					break;
			}
		},
	},
}
</script>

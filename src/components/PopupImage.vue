<template>
	<img
		class="popup-image border_1"
		:src="$store.state.dirs.uploads.images.big + data.file"
		title="Следующая"
		@click="showNextImage($event);"
	/>
</template>

<script>
export default {
	props: ["data", "currentPlace"],
	computed: {
		showNextImage: (event) => function(event) {
			event.stopPropagation();
			let currentIndex = this.currentPlace.images.indexOf(this.data)
			let ImagesLength = this.currentPlace.images.length;
			currentIndex = currentIndex == ImagesLength - 1 ? 0 : currentIndex + 1;
			this.data = this.currentPlace.images[currentIndex];
		},
	},
}
</script>

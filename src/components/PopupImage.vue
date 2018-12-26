<template>
	<div :class="'popup ' + $parent.popuped">
		<img
			class="popup-image border_1"
			:src="$store.state.dirs.uploads.images.big + data.file"
			title="Следующая"
			@click="showImage(1, $event);"
		/>
		<a href="javascript:void(0);" class="prev" @click="showImage(-1, $event);">⏴</a>
		<a href="javascript:void(0);" class="next" @click="showImage(1, $event);">⏵</a>
		<a href="javascript:void(0);" class="close" @click="$parent.showPopup({show: false}, $event);">×</a>
	</div>
</template>

<script>
export default {
	props: ["data", "currentPlace"],
	computed: {
		showImage: (step, event) => function(step, event) {
			event.stopPropagation();
			let currentIndex = this.currentPlace.images.indexOf(this.data)
			let ImagesLength = this.currentPlace.images.length;
			currentIndex = (currentIndex + step) % ImagesLength + (currentIndex + step < 0 ? ImagesLength : 0);
			this.data = this.currentPlace.images[currentIndex];
		},
	},
}
</script>

<template>
	<div>
		<img
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + data.file"
			:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedbig + data.file + '\''"
			title="Следующая"
			@click="showImage(1, $event);"
		/>
		<a href="javascript:void(0);" class="prev" @click="showImage(-1, $event);">⏴</a>
		<a href="javascript:void(0);" class="next" @click="showImage(1, $event);">⏵</a>
		<a href="javascript:void(0);" class="close" @click="$root.showPopup({show: false}, $event);">×</a>
	</div>
</template>

<script>
import {constants} from "../shared/constants.js"
export default {
	props: ["data", "currentPlace"],
	data: function() {return {
		constants: constants,
	}},
	computed: {
		showImage: (step, event) => function(step, event) {
			event.stopPropagation();
			let currentIndex = this.currentPlace.images.indexOf(this.data);
			let ImagesLength = this.currentPlace.images.length;
			currentIndex = (currentIndex + step) % ImagesLength + (currentIndex + step < 0 ? ImagesLength : 0);
			this.data = this.currentPlace.images[currentIndex];
		},
	},
}
</script>

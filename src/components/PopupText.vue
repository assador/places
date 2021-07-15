<template>
	<div>
		<div v-html="data" />
		<a
			href="javascript:void(0);"
			class="close"
			@click="$root.showPopup({show: false}, $event);"
		>
			×
		</a>
	</div>
</template>

<script>
import { constants } from '../shared/constants'
export default {
	props: ["data"],
	computed: {
	},
	mounted() {
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		keyup(event) {
			switch (constants.shortcuts[event.keyCode]) {
				case 'close' :
					this.$root.showPopup({show: false}, event);
					break;
			}
		},
	},
}
</script>

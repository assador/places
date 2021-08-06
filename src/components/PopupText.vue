<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<div v-html="content" />
		<a
			href="javascript:void(0)"
			class="close"
			@click="close($event)"
		>
			×
		</a>
	</div>
</template>

<script>
import { constants } from '../shared/constants'
export default {
	props: ['what'],
	data() {
		return {
			content: null,
			popuped: false,
		}
	},
	watch: {
		what() {
			this.open();
		},
	},
	mounted() {
		this.open();
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	beforeUpdate() {
		this.popuped = true;
	},
	methods: {
		open(event) {
			if (event) event.stopPropagation();
			switch (this.what) {
				default :
					this.$root.getAbout().then(data => {this.content = data});
			}
		},
		close(event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		keyup(event) {
			if (constants.shortcuts[event.keyCode] == 'close')  this.close();
		},
	},
}
</script>

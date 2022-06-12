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

<script lang="ts">
import { defineComponent } from 'vue';
import { constants } from '@/shared/constants';

export default defineComponent({
	props: {
		what: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			content: '',
			popuped: false,
		};
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
	beforeUnmount() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	beforeUpdate() {
		this.popuped = true;
	},
	methods: {
		open(event?: Event) {
			if (event) event.stopPropagation();
			switch (this.what) {
				default :
					this.$root.getAbout().then(
						(data: unknown) => {this.content = data as string}
					);
			}
		},
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		keyup(event: Event) {
			if (
				(constants.shortcuts as Record<string, string>)
					[(event as KeyboardEvent).keyCode] === 'close'
			) this.close(event);
		},
	},
});
</script>

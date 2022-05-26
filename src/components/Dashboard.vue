<template>
	<div id="dashboard">
		<select
			id="langs"
			v-model="lang"
		>
			<option
				v-for="(l, i) in $root.langs"
				:key="i"
				:value="l.value"
			>
				{{ l.title }}
			</option>
		</select>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			lang: sessionStorage.getItem('places-lang')
				? sessionStorage.getItem('places-lang')
				: this.$store.state.lang,
		}
	},
	watch: {
		lang() {
			this.$store.dispatch('changeLang', this.lang);
		},
	},
});
</script>

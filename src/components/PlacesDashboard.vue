<template>
	<div id="dashboard">
		<select
			id="langs"
			v-model="lang"
		>
			<option
				v-for="(l, i) in $store.state.langs"
				:key="i"
				:value="l.value"
			>
				{{ l.title }}
			</option>
		</select>
		<select
			id="colorthemes"
			v-model="colortheme"
		>
			<option
				v-for="(c, i) in $root.colorthemes"
				:key="i"
				:value="c.value"
			>
				{{ c.title }}
			</option>
		</select>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	data() {
		return {
			lang: this.$store.state.lang,
			colortheme: this.$store.state.colortheme,
		};
	},
	watch: {
		lang() {
			this.$store.dispatch('changeLang', this.lang);
		},
		colortheme() {
			this.$store.dispatch('changeColortheme', this.colortheme);
		},
	},
});
</script>

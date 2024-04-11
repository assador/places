<template>
	<div id="dashboard">
		<select
			id="langs"
			v-model="lang"
		>
			<option
				v-for="(l, i) in store.state.langs"
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
				v-for="(c, i) in colorthemes"
				:key="i"
				:value="c.value"
			>
				{{ c.title }}
			</option>
		</select>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const lang = ref(store.state.lang);
const colortheme = ref(store.state.colortheme);

const colorthemes = inject('colorthemes');

watch(() => lang.value, () => {
	store.dispatch('changeLang', lang.value);
});
watch(() => colortheme.value, () => {
	store.dispatch('changeColortheme', colortheme.value);
});
</script>

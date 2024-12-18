<template>
	<div id="dashboard">
		<select
			id="langs"
			v-model="lang"
		>
			<option
				v-for="(l, i) in store.state.main.langs"
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

const lang = ref(store.state.main.lang);
const colortheme = ref(store.state.main.colortheme);

const colorthemes = inject<typeof colorthemes>('colorthemes');

watch(() => lang.value, () => {
	store.dispatch('main/changeLang', lang.value);
});
watch(() => colortheme.value, () => {
	store.dispatch('main/changeColortheme', colortheme.value);
});
</script>

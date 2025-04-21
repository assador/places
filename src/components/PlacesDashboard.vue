<template>
	<div id="dashboard">
		<select
			id="langs"
			v-model="lang"
		>
			<option
				v-for="(l, i) in mainStore.langs"
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
import { useMainStore } from '@/stores/main';;

const mainStore = useMainStore();

const lang = ref(mainStore.lang);
const colortheme = ref(mainStore.colortheme);

const colorthemes = inject<typeof colorthemes>('colorthemes');

watch(() => lang.value, () => {
	mainStore.changeLang(lang.value);
});
watch(() => colortheme.value, () => {
	mainStore.colortheme = colortheme.value;
});
</script>

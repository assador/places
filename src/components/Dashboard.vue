<template>
	<div id="dashboard">
		<select
			id="dashboard-langs"
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
			id="dashboard-colorthemes"
			v-model="colortheme"
		>
			<option
				v-for="(c, i) in mainStore.colorthemes"
				:key="i"
				:value="c.value"
			>
				{{ c.title }}
			</option>
		</select>
		<div id="dashboard-controls-choosemap" />
		<div id="dashboard-controls-offline" />
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();

const lang = ref(mainStore.lang);
const colortheme = ref(mainStore.colortheme);

watch(() => lang.value, () => {
	mainStore.changeLang(lang.value);
});
watch(() => colortheme.value, () => {
	mainStore.colortheme = colortheme.value;
});
</script>

<style lang="scss" scoped>
#dashboard {
	display: grid;
	grid-template-areas:
		"dashboard-langs"
		"dashboard-colorthemes"
	;
	grid-template-columns: 1fr;
	grid-template-rows: auto 1fr;
	gap: 12px;
	#dashboard-langs {
		grid-area: dashboard-langs;
	}
	#dashboard-colorthemes {
		grid-area: dashboard-colorthemes;
	}
	#dashboard-controls-offline, #dashboard-controls-choosemap {
		display: none;
	}
}
#dashboard-controls-offline {
	grid-area: dashboard-controls-offline;
}
#dashboard-controls-choosemap {
	grid-area: dashboard-controls-choosemap;
}
@media screen and (max-width: 800px) {
	.header #dashboard {
		grid-template-areas:
			"dashboard-langs  dashboard-colorthemes  dashboard-controls-choosemap  dashboard-controls-offline"
		;
		grid-template-columns: auto auto auto;
		grid-template-rows: auto;
		#dashboard-controls-offline, #dashboard-controls-choosemap {
			display: block;
		}
	}
}
@media screen and (max-width: 400px) {
	.header #dashboard {
		grid-template-areas:
			"dashboard-langs"
			"dashboard-colorthemes"
			"dashboard-controls-choosemap"
			"dashboard-controls-offline"
		;
		grid-template-columns: 1fr;
		grid-template-rows: auto auto auto 1fr;
	}
}
</style>

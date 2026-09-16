<template>
	<div id="dashboard">
		<select
			v-model="lang"
			id="dashboard-langs"
		>
			<option
				v-for="(l, i) in
					mainStore.settings.vocs.user[SettingKey.Lang]?.enum
					?? vocLangs
				"
				:key="i"
				:value="l.val"
			>
				{{ getOptionLabel(l) }}
			</option>
		</select>
		<select
			v-model="theme"
			id="dashboard-colorthemes"
		>
			<option
				v-for="(c, i) in
					mainStore.settings.vocs.user[SettingKey.ColorTheme]?.enum
					?? vocColorThemes
				"
				:key="i"
				:value="c.val"
			>
				{{ getOptionLabel(c) }}
			</option>
		</select>
		<div id="dashboard-controls-choosemap" />
		<div id="dashboard-controls-offline" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Dictionary } from '@/types';
import { SettingKey, SettingType, vocLangs, vocColorThemes } from '@/types/settings';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();

const lang = computed({
	get: () => mainStore.settings.user[SettingKey.Lang] ?? 'ru',
	set: (val) => mainStore.changeSetting({ id: SettingKey.Lang, value: val }),
});
const theme = computed({
	get: () => mainStore.settings.user[SettingKey.ColorTheme] ?? 'brown',
	set: (val) => mainStore.changeSetting({ id: SettingKey.ColorTheme, value: val }),
});

type DictionaryInputKey = keyof Dictionary['s'];
const getOptionLabel = (opt: { val: SettingType; extra?: string }): string => {
	if (!opt.extra) return String(opt.val);
	if (opt.extra in mainStore.t.s) {
		return mainStore.t.s[opt.extra as DictionaryInputKey];
	}
	return opt.extra;
}
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
			"dashboard-langs  dashboard-colorthemes  dashboard-controls-choosemap"
		;
		grid-template-columns: auto auto auto;
		grid-template-rows: auto;
		#dashboard-controls-choosemap {
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

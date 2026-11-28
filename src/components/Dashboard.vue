<template>
	<div id="dashboard">
		<select
			id="dashboard-langs"
			:value="mainStore.getSettingValue(SettingKeyEnum.Lang)"
			@change="e => {
				mainStore.setSetting(
					mainStore.settings.usersvoc[SettingKeyEnum.Lang],
					(e.currentTarget as HTMLSelectElement).value,
				);
			}"
		>
			<option
				v-for="(l, i) in
					mainStore.getOptionsForEnumId(
						mainStore.settings.usersvoc[SettingKeyEnum.Lang]?.enumid,
					) ?? vocLangs
				"
				:key="i"
				:value="l.val"
			>
				{{ mainStore.getOptionLabel(l) }}
			</option>
		</select>
		<select
			id="dashboard-colorthemes"
			:value="mainStore.getSettingValue(SettingKeyEnum.ColorTheme)"
			@change="e => {
				mainStore.setSetting(
					mainStore.settings.usersvoc[SettingKeyEnum.ColorTheme],
					(e.currentTarget as HTMLSelectElement).value,
				);
			}"
		>
			<option
				v-for="(c, i) in
					mainStore.getOptionsForEnumId(
						mainStore.settings.usersvoc[SettingKeyEnum.ColorTheme]?.enumid,
					) ?? vocColorThemes
				"
				:key="i"
				:value="c.val"
			>
				{{ mainStore.getOptionLabel(c) }}
			</option>
		</select>
		<div id="dashboard-controls-choosemap" />
		<div id="dashboard-controls-offline" />
	</div>
</template>

<script setup lang="ts">
import {
	SettingKeyEnum,
	vocLangs,
	vocColorThemes
} from '@/types/settings';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
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

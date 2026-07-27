<template>
	<div class="popup popup-tiles-import">
		<div class="popup-content centered">
			<h1>
				{{ mainStore.t.i.maps.mapImport }} (.zip)
			</h1>
			<div v-if="!isProcessing" class="popup-tiles-import__controls">
				<div
					class="tiles-add"
					@click.stop="if (isFileInput(inputTilesZip)) { inputTilesZip.click(); }"
				>
					<input
						ref="inputTilesZip"
						type="file"
						accept=".zip"
						class="tiles-add__input"
						@change="handleFileSelect"
					/>
					<button class="tiles-add__button button-iconed icon icon-plus-circled" />
					<div class="tiles-add__text">
						{{ mainStore.t.i.maps.chooseTilesZip }}
					</div>
				</div>
				<div>
					<button @click="onClearTiles">
						{{ mainStore.t.i.maps.clearTileDatabase }}
					</button>
				</div>
			</div>
			<div v-else class="popup-tiles-import__controls">
				<div>{{ mainStore.t.i.maps.unpackingTiles }}…</div>
				<div class="progress-bar border_1">
					<div
						class="progress-bar__line highlighted"
						:style="{ width: `${progress.percent}%` }"
					/>
					<div class="progress-bar__value">
						<span class="imp_02">{{ progress.percent }}</span> %
					</div>
				</div>

				<p class="text-xs text-gray-400 text-right">
					{{ progress.current }}
					{{ mainStore.t.i.text.from }}
					{{ progress.total }}
				</p>
			</div>
		</div>
		<a
			href="javascript:void(0)"
			class="close"
			@click="showPopupImportTiles = false"
		>
			×
		</a>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { isFileInput } from '@/guards';
import {
	unpackTilesZip,
	clearOfflineTiles,
	type UnpackProgress,
} from '@/services/tilestorage';

const emit = defineEmits<{
	(e: 'imported', count: number): void;
	(e: 'cleared'): void;
}>();

const mainStore = useMainStore();
const showPopupImportTiles = inject<Ref<boolean>>('showPopupImportTiles');
const inputTilesZip = ref<HTMLInputElement | null>(null);

const isProcessing = ref(false);
const progress = ref<UnpackProgress>({ total: 0, current: 0, percent: 0 });

const handleFileSelect = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];

	if (!file) return;

	isProcessing.value = true;
	progress.value = { total: 0, current: 0, percent: 0 };

	try {
		const result = await unpackTilesZip(file, (p) => {
			progress.value = p;
		});
		mainStore.setMessage(`${mainStore.t.i.maps.tilesLoaded}: ${result.count}`);
		emit('imported', result.count);
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.errors.maps.failedToImportZip);
	} finally {
		isProcessing.value = false;
		target.value = '';
	}
};
const onClearTiles = async () => {
	try {
		await clearOfflineTiles();
		mainStore.setMessage(mainStore.t.i.maps.tileDatabaseCleared, 3);
		emit('cleared');
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.errors.maps.failedToClearTileDatabase);
	}
};
</script>

<style lang="scss" scoped>
.popup-content {
	overflow: hidden;
}
.popup-tiles-import__controls {
	display: grid;
	grid-template-columns: auto;
	grid-template-rows: repeat(auto-fit, minmax(auto, 1fr));
	gap: 20px;
	max-width: 600px; max-height: 100%;
	text-align: center;
}
.tiles-add {
	display: flex;
	gap: 12px;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	&__input {
		display: none;
	}
}
.progress-bar {
	min-width: 200px;
}
</style>

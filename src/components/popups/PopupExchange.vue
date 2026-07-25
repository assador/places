<template>
	<div class="popup popup-export">
		<div class="popup-content centered">

			<h2
				class="import-button imp_02"
				@click.stop="importFromFileInput?.click()"
			>
				<input
					id="import-from-file-input"
					ref="importFromFileInput"
					name="jsonFile"
					type="file"
					accept=".json,.gpx,text/xml,application/json"
					@change="importFromFile"
				/>
				<div class="import-button__text">
					{{ mainStore.t.i.captions.importPlaces }}
				</div>
				<button class="import-button__button button-iconed icon icon-plus-circled" />
			</h2>


			<h2 class="imp_02">
				{{ mainStore.t.i.captions.exportPlaces }}
			</h2>
			<form
				class="popup-export__form"
				@submit.prevent="handleExportSubmit"
			>
				<p class="margin_bottom_0">
					{{ mainStore.t.i.text.specifyFormatToExport }}:
				</p>
				<fieldset class="popup-export__settings margin_bottom">
					<label>
						<input
							name="mime"
							type="radio"
							checked
							value="json"
						/>
						<span>JSON</span>
						<span
							class="icon icon_s icon-help"
							@click.stop.prevent="mainStore.setMessage(mainStore.t.i.text.descJson)"
						/>
					</label>
					<label>
						<input
							name="mime"
							type="radio"
							value="gpx"
						/>
						<span>GPX</span>
						<span
							class="icon icon_s icon-help"
							@click.stop.prevent="mainStore.setMessage(mainStore.t.i.text.descGpx)"
						/>
					</label>
				</fieldset>
				<p>{{ mainStore.t.i.text.specifyPlacesToExport }}:</p>
				<div
					v-if="
						Object.keys(mainStore.places).length ||
						Object.keys(mainStore.folders).length
					"
					class="popup-export__tree menu"
				>
					<Tree instanceid="popupexporttree" what="places" :editable="false" />
				</div>
				<fieldset class="popup-export__buttons">
					<button type="submit">
						{{ mainStore.t.i.buttons.export }}
					</button>
				</fieldset>
			</form>
		</div>
		<a
			href="javascript:void(0)"
			class="close"
			@click="showPopupExchange = false"
		>
			×
		</a>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, inject, nextTick } from 'vue';
import { ImportExportFormat } from '@/types';
import { isFileInput } from '@/guards';
import { useMainStore } from '@/stores/main';
import { exportPlaces } from '@/shared/importexport';
import Tree from '@/components/tree/Tree.vue';

const mainStore = useMainStore();
const showPopupExchange = inject<Ref<boolean>>('showPopupExchange');
const importFromFileInput = ref<HTMLInputElement | null>(null);

const handleExportSubmit = (e: Event) => {
	const formElement = e.currentTarget as HTMLFormElement;
	const formData = new FormData(formElement);
	const mimeType = formData.get('mime') as ImportExportFormat;
	exportPlaces(mimeType);
};
const importFromFile = async () => {
	const input = importFromFileInput?.value;
	if (!isFileInput(input)) return;
	const file = input.files[0];
	if (!file) return;
	const mime = file.type;
	if (mime !== 'application/json' && mime !== 'application/gpx+xml') {
		mainStore.setMessage(mainStore.t.m.popup.invalidImportFileType);
		return;
	}
	const reader = new FileReader();
	reader.onload = async (event: ProgressEvent<FileReader>) => {
		await nextTick();
		mainStore.addImported({ mime, text: event.target?.result as string });
		input.value = '';
	};
	reader.readAsText(file);
};
</script>

<style lang="scss" scoped>
.popup-content {
	overflow: hidden;
}
.import-button {
	display: flex;
	gap: 12px;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	&__input {
		display: none;
	}
}
.popup-export__form {
	display: grid;
	grid-template-rows: auto auto auto 1fr auto;
	max-width: 600px; max-height: 100%;
	text-align: center;
	fieldset {
		margin: 1em;
	}
	label {
		display: block;
	}
}
.popup-export__tree {
	margin: 0 auto;
	padding: 1px 40px 1px 0;
	text-align: left;
	overflow: auto;
}
.popup-export__buttons {
	display: flex;
	gap: 12px;
	justify-content: center;
}
.popup-export__settings {
	display: flex;
	gap: 24px;
	justify-content: center;
	label {
		display: flex;
		flex-flow: row nowrap;
		gap: 8px;
		align-items: center;
		input {
			line-height: 0;
			margin-top: -3px;
		}
		span.icon {
			display: inline-block;
			opacity: 0.5;
			cursor: pointer;
		}
	}
}
</style>

<template>
	<transition name="fade">
		<div
			v-if="show"
			class="popup"
		>
			<div class="popup-content centered folder-new">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ mainStore.t.i.captions.newFolder }}
					</h1>
				</div>
				<form
					class="folder-new__form margin_bottom_0"
					@click.stop
					@submit.prevent="createFolder"
				>
					<fieldset class="folder-new__form__fields">
						<div class="imp">
							{{ mainStore.t.i.captions.name }}:
						</div>
						<input
							ref="folderNameInput"
							v-model="folderName"
							class="fieldwidth_100"
							required
							type="text"
						/>
						<div class="imp">
							{{ mainStore.t.i.captions.description }}:
						</div>
						<textarea
							id="folderDescription"
							v-model="folderDescription"
							class="fieldwidth_100"
						/>
					</fieldset>
					<fieldset class="folder-new__form__buttons">
						<button type="submit">
							{{ mainStore.t.i.buttons.createFolder }}
						</button>
						<button @click="close()">
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
					<div class="folder-new__form__message">
						{{ message }}
					</div>
				</form>
				<a
					href="javascript:void(0)"
					class="close"
					@click="close()"
				>
					×
				</a>
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import { FolderContext } from '@/types';

const mainStore = useMainStore();

export interface IPlacesPopupFolderProps {
	parent?: string | null;
	context?: FolderContext;
}
const props = withDefaults(defineProps<IPlacesPopupFolderProps>(), {
	parent: null,
	context: 'places',
});

const folderNameInput = ref(null);
const folderName = ref('');
const folderDescription = ref('');
const message = ref(' ');
const show = ref(false);

const router = useRouter();
const route = useRoute();

const createFolder = (): void => {
	mainStore.upsertFolder({
		props: {
			parent: props.parent,
			context: props.context,
			name: folderName.value,
			description: folderDescription.value,
		},
	});
	folderName.value = '';
	message.value = mainStore.t.i.text.folderCreated;
	if (folderNameInput.value) folderNameInput.value.focus();
	setTimeout(() => message.value = ' ', 2000);
};
const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
onMounted(async () => {
	show.value = true;
	await nextTick();
	if (folderNameInput.value) folderNameInput.value.focus();
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss" scoped>
.folder-new {
	&__form {
		fieldset {
			margin: 1em;
		}
		label {
			display: flex;
			gap: 6px;
			align-items: baseline;
		}
		&__fields {
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 8px;
			align-items: baseline;
		}
		&__buttons {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			justify-content: center;
		}
	}
}
</style>

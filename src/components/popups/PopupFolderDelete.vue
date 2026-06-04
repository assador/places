<template>
	<transition name="fade">
		<div
			v-if="show"
			class="popup"
		>
			<div class="popup-content centered folder-delete">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ mainStore.t.i.captions.deletingFolder }}
					</h1>
					<p class="margin_bottom_0">
						«{{ folder ? folder.name : '' }}»
					</p>
				</div>
				<p class="margin_bottom_0">
					{{ mainStore.t.i.text.whatToDoWithFolder }}:
				</p>
				<form
					class="folder-delete__form margin_bottom_0"
					@submit.prevent="deleteFolder()"
				>
					<fieldset class="margin_bottom">
						<label>
							<input
								v-model="keepContent"
								name="content"
								type="radio"
								value="keep"
							/>
							<span>{{ mainStore.t.i.inputs.leaveContentInRoot }}</span>
						</label>
						<label>
							<input
								v-model="keepContent"
								name="content"
								type="radio"
								value="delete"
							/>
							<span>{{ mainStore.t.i.inputs.deleteContent }}</span>
						</label>
					</fieldset>
					<fieldset class="folder-delete__form__buttons">
						<button type="submit">
							{{ mainStore.t.i.buttons.deleteFolder }}
						</button>
						<button type="button" @click="close()">
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</form>
				<a
					href="javascript:void(0);"
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';

export interface IPlacesPopupFolderDeleteProps {
	id: string;
	type?: string;
}
const props = withDefaults(defineProps<IPlacesPopupFolderDeleteProps>(), {
	id: undefined,
	type: 'places',
});

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const keepContent = ref('keep');
const show = ref(false);
const folder = ref(mainStore.folders[props.id]);

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const deleteFolder = (): void => {
	const objectsToDelete = mainStore.prepareFolderDelete(
		folder.value.id,
		keepContent.value,
	);
	mainStore.deleteObjects(
		keepContent.value === 'delete'
			? objectsToDelete
			: { [folder.value.id]: folder.value }
	);
	close();
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
	window.setTimeout(() => show.value = true, 1);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss" scoped>
.folder-delete {
	&__form {
		fieldset {
			margin: 1em;
		}
		label {
			display: flex;
			gap: 6px;
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

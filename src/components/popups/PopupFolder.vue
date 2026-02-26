<template>
	<transition name="fade">
		<div
			v-if="popuped"
			class="popup"
		>
			<div class="popup-content centered">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ mainStore.t.i.captions.newFolder }}
					</h1>
				</div>
				<form
					class="folder-new__form margin_bottom_0"
					@click.stop
					@submit.prevent="mainStore.upsertFolder({
						props: {
							parent: parent,
							context: context,
							name: folderName ? folderName : '',
							description: folderDescription ? folderDescription : '',
						},
					})"
				>
					<table class="table_form">
						<tbody>
							<tr>
								<th>{{ mainStore.t.i.captions.name }}:</th>
								<td>
									<input
										id="folderName"
										v-model="folderName"
										class="fieldwidth_100"
										required
										type="text"
									/>
								</td>
							</tr>
							<tr>
								<th>{{ mainStore.t.i.captions.description }}:</th>
								<td>
									<textarea
										id="folderDescription"
										v-model="folderDescription"
										class="fieldwidth_100"
									/>
								</td>
							</tr>
							<tr class="back_0">
								<th />
								<td style="padding-top: 18px; vertical-align: top;">
									<button type="submit">
										{{ mainStore.t.i.buttons.createFolder }}
									</button>
									&#160;
									<button @click="close()">
										{{ mainStore.t.i.buttons.cancel }}
									</button>
								</td>
							</tr>
							<tr class="back_0">
								<th />
								<td style="padding-top: 18px;">
									{{ message }}
								</td>
							</tr>
						</tbody>
					</table>
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
import { ref, onMounted, onUnmounted, onUpdated, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import { makeFieldsValidatable } from '@/shared';

const mainStore = useMainStore();

export interface IPlacesPopupFolderProps {
	parent?: string | null;
	context?: string;
}
const props = withDefaults(defineProps<IPlacesPopupFolderProps>(), {
	parent: null,
	context: 'places',
});

const folderName = ref('');
const folderDescription = ref('');
const message = ref('');
const popuped = ref(false);

const router = useRouter();
const route = useRoute();

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
onMounted(async () => {
	popuped.value = true;
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	document.getElementById('folderName')!.focus();
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
onUpdated(() => {
	makeFieldsValidatable(mainStore.t);
});
</script>

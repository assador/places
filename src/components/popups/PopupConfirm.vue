<template>
	<transition name="fade">
		<div
			v-if="popuped"
			class="popup"
		>
			<div class="popup-content centered">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ mainStore.t.i.captions.sure }}
					</h1>
					<p v-if="props.message">
						{{ props.message }}
					</p>
				</div>
				<form
					class="folder-delete__form margin_bottom_0"
					@click.stop
					@submit.prevent="() => {
						props.callback(...props.arguments);
						close();
					}"
				>
					<div style="text-align: center;">
						<fieldset>
							<button type="submit">
								{{ mainStore.t.i.buttons.yes }}
							</button>
							&#160;
							<button
								type="button"
								@click="() => close()"
							>
								{{ mainStore.t.i.buttons.cancel }}
							</button>
						</fieldset>
					</div>
				</form>
				<a
					href="javascript:void(0);"
					class="close"
					@click="() => close()"
				>
					×
				</a>
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { confirm } from '@/services/confirm';
import { useMainStore } from '@/stores/main';

export interface IPlacesPopupConfirmProps {
	message?: string;
	callback: any;
	arguments: readonly any[];
}
const props = withDefaults(defineProps<IPlacesPopupConfirmProps>(), {
	message: null,
	callback: null,
	arguments: null,
});

const mainStore = useMainStore();
const popuped = ref(false);

const close = (): void => {
	popuped.value = false;
	window.setTimeout(() => {
		confirm.close();
	}, 1000);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
	window.setTimeout(() => popuped.value = true, 1);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

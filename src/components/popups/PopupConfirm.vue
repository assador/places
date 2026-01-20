<template>
	<div :class="'popup ' + (popuped ? 'appear' : 'disappear')">
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
				@click="e => e.stopPropagation()"
				@submit.prevent="() => {props.callback(...props.arguments); close();}"
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
</template>

<script setup lang="ts">
import { ref, Ref, inject, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';

export interface IPlacesPopupConfirmProps {
	callback: any;
	arguments: any[];
	message?: string;
}
const props = withDefaults(defineProps<IPlacesPopupConfirmProps>(), {
	callback: null,
	arguments: null,
	message: null,
});

const mainStore = useMainStore();
const confirmPopup = inject<Ref<boolean>>('confirmPopup');
const popuped = ref(false);

const close = (): void => {
	popuped.value = false;
	window.setTimeout(() => {
		confirmPopup.value = false;
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

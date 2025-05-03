<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
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
				@click="e => e.stopPropagation()"
				@submit.prevent="e => {props.callback(...props.arguments); close(e);}"
			>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ mainStore.t.i.buttons.yes }}
						</button>
						&#160;
						<button
							type="button"
							@click="e => close(e)"
						>
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</div>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="e => close(e)"
			>
				×
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, inject, onMounted } from 'vue';
import { constants } from '../shared/constants';
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

const close = (event: Event): void => {
	if (event) event.stopPropagation();
	popuped.value = false;
	window.setTimeout(() => {
		confirmPopup.value = false;
	}, 1000);
};
const keyup = (event: Event): void => {
	if (
		(constants.shortcuts as Record<string, string>)
			[(event as KeyboardEvent).code] === 'close'
	) close(event);
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
	window.setTimeout(() => {popuped.value = true;}, 1);
});
</script>

<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div v-html="content" />
		<a
			href="javascript:void(0)"
			class="close"
			@click="e => close(e)"
		>
			×
		</a>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, onBeforeUpdate } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getAbout } from '@/shared/common';

export interface IPlacesPopupTextProps {
	what?: string;
}
const props = withDefaults(defineProps<IPlacesPopupTextProps>(), {
	what: 'about',
});

const content = ref('');
const popuped = ref(false);

const router = useRouter();
const route = useRoute();

const open = (event?: Event): void => {
	if (event) event.stopPropagation();
	switch (props.what) {
		case 'about':
			getAbout().then(
				(data: unknown) => {content.value = data as string}
			);
			break;
		default:
			content.value = '';
	}
};
const close = (event: Event): void => {
	if (event) event.stopPropagation();
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: Event): void => {
	if ((event as KeyboardEvent).code === 'Escape') close(event);
};

watch(() => props.what, () => {
	open();
});
onMounted(() => {
	open();
	document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
onBeforeUpdate(() => {
	popuped.value = true;
});
</script>

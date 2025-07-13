<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div>
			<places-about v-if="props.what === 'about'" />
		</div>
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PlacesAbout from './PlacesAbout.vue';

export interface IPlacesPopupTextProps {
	what?: string;
}
const props = withDefaults(defineProps<IPlacesPopupTextProps>(), {
	what: '',
});

const popuped = ref(false);

const router = useRouter();
const route = useRoute();

watch(() => props.what, () => {
	popuped.value = (props.what === '' ? false : true);
});
const close = (event: Event): void => {
	if (event) event.stopPropagation();
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: Event): void => {
	if ((event as KeyboardEvent).code === 'Escape') close(event);
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
	window.setTimeout(() => {
		popuped.value = (props.what === '' ? false : true);
	}, 1);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

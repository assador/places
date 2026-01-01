<template>
	<div :class="'popup ' + (popuped ? 'appear' : 'disappear')">
		<div>
			<About v-if="props.what === 'about'" />
		</div>
		<a
			href="javascript:void(0)"
			class="close"
			@click="close()"
		>
			×
		</a>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import About from './About.vue';

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
const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
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

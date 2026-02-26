<template>
	<transition name="fade">
		<div
			v-if="popuped"
			class="popup"
		>
			<About v-if="props.what === 'about' && mainStore.lang === 'ru'" />
			<AboutEn v-if="props.what === 'about' && mainStore.lang === 'en'" />
			<a
				href="javascript:void(0)"
				class="close"
				@click="close()"
			>
				×
			</a>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import About from '@/components/About.vue';
import AboutEn from '@/components/AboutEn.vue';

export interface IPlacesPopupTextProps {
	what?: string;
}
const props = withDefaults(defineProps<IPlacesPopupTextProps>(), {
	what: '',
});

const popuped = ref(false);

const mainStore = useMainStore();
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

<template>
	<transition name="fade">
		<div
			v-if="show"
			ref="popupRef"
			class="popup"
		>
			<About v-if="props.what === 'about' && mainStore.lang === 'ru'" />
			<AboutEn v-if="props.what === 'about' && mainStore.lang === 'en'" />
			<a
				href="javascript:void(0)"
				class="close"
				@click.prevent="close"
			>
				×
			</a>
			<a
				href="javascript:void(0)"
				class="up"
				@click.prevent="scrollToTop"
			>
				^
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

const show = ref(false);
const popupRef = ref<HTMLElement | null>(null);

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

watch(() => props.what, () => {
	show.value = (props.what === '' ? false : true);
});
const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const scrollToTop = (): void => {
	if (popupRef.value) {
		const container = popupRef.value.querySelector('.readable');
		if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
	}
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
	window.setTimeout(() => {
		show.value = (props.what === '' ? false : true);
	}, 1);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

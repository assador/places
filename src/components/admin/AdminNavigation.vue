<template>
	<nav>
		<div
			v-for="(section, key) in sections"
			:key="key"
			class="place-button block_01"
			:class="{' active': key === component}"
			@click="component = key"
		>
			{{ section }}
		</div>
	</nav>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

export interface IAdminNavigationProps {
	prop: 0,
}
/*
const props = withDefaults(defineProps<IAdminNavigationProps>(), {
	prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();

const component = inject('component');

const sections = computed(() => ({
	users: mainStore.t.i.captions.users,
	groups: mainStore.t.i.captions.groups,
}));
</script>

<template>
	<nav>
		<div
			v-for="(section, key) in sections"
			:key="key"
			class="tree-item block_01"
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

const mainStore = useMainStore();
const component = inject('component');
const sections = computed(() => ({
	users: mainStore.t.i.captions.users,
	groups: mainStore.t.i.captions.groups,
}));
</script>

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
import { useStore } from 'vuex';

export interface IAdminNavigationProps {
	prop: 0,
}
/*
const props = withDefaults(defineProps<IAdminNavigationProps>(), {
	prop: 0,
});
*/
const store = useStore();

const component = inject('component');

const sections = computed(() => ({
	users: store.state.main.t.i.captions.users,
	groups: store.state.main.t.i.captions.groups,
}));
</script>

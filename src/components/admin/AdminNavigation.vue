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
import { ref, computed, watch, inject } from 'vue';
import { useStore } from 'vuex';

export interface IAdminNavigationProps {
}
const props = withDefaults(defineProps<IAdminNavigationProps>(), {
});

const store = useStore();

const component = inject('component');

const sections = computed(() => ({
	users: store.state.main.t.i.captions.users,
	groups: store.state.main.t.i.captions.groups,
}));
</script>

<template>
	<nav>
		<div
			v-for="(section, key) in sections"
			:key="key"
			class="tree-item block_01"
			:class="{
				back_5: key === component,
				back_4: !saved(key),
			}"
			@click="component = key"
		>
			{{ section }}
		</div>
	</nav>
</template>

<script setup lang="ts">
import { Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

const mainStore = useMainStore();
const adminStore = useAdminStore();

const component = inject<Ref<string>>('component');

const sections = computed(() => ({
	users: mainStore.t.i.captions.users,
	groups: mainStore.t.i.captions.groups,
	settings: mainStore.t.i.captions.settings,
}));
const saved = (key: string) => {
	switch (key) {
		case 'users':
			return adminStore.savedUsers;
		case 'groups':
			return adminStore.savedGroups;
		case 'settings':
			return adminStore.savedSettings;
		default:
			return undefined;
	}
};
</script>

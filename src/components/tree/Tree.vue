<template>
	<ul class="places-tree">
		<TreeNode
			:instanceid="instanceid"
			:what="what"
			:folder="mainStore.trees[what]"
			:folders-checked-ids="foldersCheckedIds"
			class="folder-root"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { formFoldersCheckedIds } from '@/shared';
import TreeNode from '@/components/tree/TreeNode.vue';

export interface IPlacesTreeProps {
	instanceid?: string;
	what?: 'places' | 'routes';
}
const props = withDefaults(defineProps<IPlacesTreeProps>(), {
	instanceid: '',
	what: 'places',
});
const mainStore = useMainStore();

const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);

onMounted(() => {
	foldersCheckedIds.value = formFoldersCheckedIds();
});
</script>

<style lang="scss" scoped>
.places-tree:not(:has(.folder_editable)) * {
	pointer-events: none;
}
.folder-root {
	padding: 0;
}
</style>

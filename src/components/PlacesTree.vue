<template>
	<ul>
		<places-tree-node
			:instanceid="instanceid"
			:folder="mainStore.tree"
			:folders-checked-ids="foldersCheckedIds"
			class="folder_root"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';;
import PlacesTreeNode from './PlacesTreeNode.vue';
import { formFoldersCheckedIds } from '../shared/common';

export interface IPlacesTreeProps {
	instanceid?: string;
}
const props = withDefaults(defineProps<IPlacesTreeProps>(), {
	instanceid: '',
});
const mainStore = useMainStore();

const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);

onMounted(() => {
	foldersCheckedIds.value = formFoldersCheckedIds();
});
</script>

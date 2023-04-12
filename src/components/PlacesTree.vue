<template>
	<ul>
		<places-tree-node
			:instanceid="instanceid"
			:folder="$store.state.tree"
			:folders-checked-ids="foldersCheckedIds"
			class="folder_root"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import PlacesTreeNode from './PlacesTreeNode.vue';
import { formFoldersCheckedIds } from '../shared/common';

export interface IPlacesTreeNodeProps {
	instanceid?: string;
}
const props = withDefaults(defineProps<IPlacesTreeNodeProps>(), {
	instanceid: '',
});

const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);

onMounted(() => {
	foldersCheckedIds.value = formFoldersCheckedIds();
});
</script>

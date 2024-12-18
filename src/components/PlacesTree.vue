<template>
	<ul>
		<places-tree-node
			:instanceid="instanceid"
			:folder="store.state.main.tree"
			:folders-checked-ids="foldersCheckedIds"
			class="folder_root"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useStore } from 'vuex';
import PlacesTreeNode from './PlacesTreeNode.vue';
import { formFoldersCheckedIds } from '../shared/common';

export interface IPlacesTreeProps {
	instanceid?: string;
}
const props = withDefaults(defineProps<IPlacesTreeProps>(), {
	instanceid: '',
});
const store = useStore();

const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);

onMounted(() => {
	foldersCheckedIds.value = formFoldersCheckedIds();
});
</script>

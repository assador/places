<template>
	<ul class="tree">
		<TreeNode
			:instanceid="instanceid"
			:what="what"
			:folder="mainStore.trees[what]"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { formFoldersCheckedIds } from '@/shared/generators';
import TreeNode from '@/components/tree/TreeNode.vue';

export interface IPlacesTreeProps {
	instanceid?: string;
	what?: 'places' | 'routes';
}
withDefaults(defineProps<IPlacesTreeProps>(), {
	instanceid: '',
	what: 'places',
});
const mainStore = useMainStore();

const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);

const dragging = ref(false);
provide('dragging', dragging);

const dragTargetId = ref(null);
provide('dragTargetId', dragTargetId);

const dragTargetContext = ref(null);
provide('dragTargetContext', dragTargetContext);

onMounted(() => {
	foldersCheckedIds.value = formFoldersCheckedIds();
});
</script>

<template>
	<ul class="tree">
		<component
			:is="itemComponent"
			:instanceid="instanceid"
			:what="props.what"
			:editable="props.editable"
			:folder="
				props.what === 'settingsvoc'
					? adminStore.trees.settingsvoc
					: mainStore.trees[props.what]
				"
			:parent="null"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import { FolderContext } from '@/types';
import TreeBranch from './TreeBranch.vue';
import TreeBranchSettings from './TreeBranchSettings.vue';
import TreeBranchSettingsVoc from './TreeBranchSettingsVoc.vue';

export interface PlacesTreeProps {
	instanceid?: string;
	editable?: boolean;
	what: FolderContext;
}
const props = withDefaults(defineProps<PlacesTreeProps>(), {
	instanceid: '',
	editable: true,
});

const mainStore = useMainStore();
const adminStore = useAdminStore();

const dragging = ref(false);
provide('dragging', dragging);

const dragTargetId = ref(null);
provide('dragTargetId', dragTargetId);

const dragTargetContext = ref(null);
provide('dragTargetContext', dragTargetContext);

const itemComponent = computed(() => {
	return (
		props.what === 'settings' ? TreeBranchSettings :
		props.what === 'settingsvoc' ? TreeBranchSettingsVoc :
		TreeBranch
	);
});
</script>

<style lang="scss" scoped>
ul {
	padding-left: 0;
}
</style>

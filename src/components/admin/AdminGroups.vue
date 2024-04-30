<template>
	<h1>{{ store.state.t.i.captions.groups }}</h1>
	<div class="control-panel">
		<div class="control-panel__sortby">
			<span>{{ store.state.t.i.captions.srt }}:</span>
			<select
				id="sort"
				v-model="sortBy"
			>
				<option
					v-for="(value, key) in sortKeys"
					:key="key"
					:value="key"
				>
					{{ value }}
				</option>
			</select>
		</div>
		<div class="control-panel__tablemode">
			<button @click="tableMode = 1">
				<img src="@/assets/icons/dark/list.svg">
			</button>
			<button @click="tableMode = 2">
				<img src="@/assets/icons/dark/tiles.svg">
			</button>
			<button @click="tableMode = 3">
				<img src="@/assets/icons/dark/list_01.svg">
			</button>
		</div>
	</div>
	<div :class="'table table-' + tableMode + ' table-' + tableMode + '_7'">
		<div v-if="tableMode === 1">
			<h3
				v-for="(value, key) in sortKeys"
				:key="key"
			>
				{{ value }}
			</h3>
		</div>
		<div
			v-for="(group, index) in groups"
			:key="index"
		>
			<template
				v-for="(value, key) in group"
				:key="key"
			>
				<div v-if="value || tableMode === 1">
					<div v-if="tableMode !== 1">
						{{ sortKeys[key] }}
					</div>
					<div :class="{'impvalue': key as unknown as string === sortBy}">
						{{ value }}
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { Group } from '@/store/types';

export interface IAdminGroupsProps {
}
const props = withDefaults(defineProps<IAdminGroupsProps>(), {
});

const store = useStore();

const tableMode = ref(1);

const sortKeys = computed(() => ({
	id: store.state.t.i.captions.id,
	parent: store.state.t.i.captions.parent,
	name: store.state.t.i.captions.name,
	description: store.state.t.i.captions.description,
	owner: store.state.t.i.captions.owner,
	system: store.state.t.i.captions.system,
	haschildren: store.state.t.i.captions.haschildren,
}));
const sortBy = ref('id');

watch(() => sortBy.value, () => {
	sortGroups(groups);
});

const sortGroups = (result) => {
	result.value.sort((a, b) => {
		const stringA = a[sortBy.value] ? a[sortBy.value].toString().toUpperCase() : '';
		const stringB = b[sortBy.value] ? b[sortBy.value].toString().toUpperCase() : '';
		if (stringA < stringB) return -1;
		if (stringA > stringB) return 1;
		return 0;
	});
}
const getGroups = async (result) => {
	axios.post('/backend/get_allgroups.php', {
		user: {
			id: sessionStorage.getItem('places-userid'),
			password: store.state.user.password,
		},
	})
	.then(response => {
		switch (response.data) {
			case false :
				throw new Error('Administrator’s password failed the verification');
				return;
			default :
				result.value = response.data as Group[];
				sortGroups(result);
			}
		})
	;
}
const groups = ref([]);
onMounted(() => {
	getGroups(groups);
});
</script>

<style lang="scss" scoped>
.control-panel {
	display: grid;
	grid-template-columns: 1fr auto;
	& > * {
		display: flex;
		gap: 12px;
		align-items: center;
	}
}
.table {
	position: absolute;
	top: 80px; right: 0; bottom: 0; left: 0;
	overflow: auto;
	h3 {
		margin: 0;
	}
	.impvalue {
		margin-top: -5px;
		font-size: 180%;
	}
	&.table-1 {
		top: 100px; right: 6px; bottom: 6px;
	}
}
</style>

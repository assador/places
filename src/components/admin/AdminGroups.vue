<template>
	<h1>{{ store.state.main.t.i.captions.groups }}</h1>
	<div class="control-panel">
		<div class="control-panel__sortby">
			<span>{{ store.state.main.t.i.captions.srt }}:</span>
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
				<div
					v-if="
						(value !== '' || tableMode === 1) &&
						key as unknown as string !== 'checked'
					"
				>
					<div v-if="tableMode !== 1">
						{{ sortKeys[key] }}
					</div>
					<div :class="{'impvalue': key as unknown as string === sortBy}">
						<a
							v-if="key as unknown as string === 'owner'"
							href="javascript:void(0)"
							@click="goToUser(value)"
						>
							{{ store.state.admin.users.find(u => u.id === value).login }}
						</a>
						<span v-else>
							{{ (typeof value === 'boolean'
								? (value === true
									? store.state.main.t.i.text.yes
									: store.state.main.t.i.text.no
								)
								: value
							) }}
						</span>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';
import { User } from '@/store/types';

export interface IAdminGroupsProps {
	prop: 0,
}
/*
const props = withDefaults(defineProps<IAdminGroupsProps>(), {
	prop: 0,
});
*/
const store = useStore();

const tableMode = ref(1);
const sortBy = ref('');

const component = inject('component');

const sortKeys = computed(() => ({
	id: store.state.main.t.i.captions.id,
	parent: store.state.main.t.i.captions.parent,
	name: store.state.main.t.i.captions.name,
	description: store.state.main.t.i.captions.description,
	owner: store.state.main.t.i.captions.owner,
	system: store.state.main.t.i.captions.system,
	haschildren: store.state.main.t.i.captions.haschildren,
}));
const groups = computed(() => store.state.admin.groups);

onMounted(() => {
	watch(() => sortBy.value, () => {
		store.dispatch('admin/setGroupsSortBy', sortBy.value);
		store.dispatch('admin/sort', {what: 'groups', by: sortBy.value});
	});
	sortBy.value = store.state.admin.groupsSortBy;
});

const goToUser = (id: string): void => {
	const user = store.state.admin.users.find((u: User) => u.id === id);
	if(typeof user === 'undefined') return;
	store.commit('admin/change', {where: user, what: 'checked', to: true});
	component.value = 'users';
}
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

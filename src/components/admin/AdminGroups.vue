<template>
	<h1>{{ mainStore.t.i.captions.groups }}</h1>
	<div class="control-panel">
		<div class="control-panel__sortby">
			<span>{{ mainStore.t.i.captions.srt }}:</span>
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
				<img src="@/assets/icons/dark/list.svg" />
			</button>
			<button @click="tableMode = 2">
				<img src="@/assets/icons/dark/tiles.svg" />
			</button>
			<button @click="tableMode = 3">
				<img src="@/assets/icons/dark/list_01.svg" />
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
							{{ adminStore.users.find(u => u.id === value).login }}
						</a>
						<span v-else>
							{{ (typeof value === 'boolean'
								? (value === true
									? mainStore.t.i.text.yes
									: mainStore.t.i.text.no
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
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import { User } from '@/stores/types';

export interface IAdminGroupsProps {
	prop: 0,
}
/*
const props = withDefaults(defineProps<IAdminGroupsProps>(), {
	prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();

const tableMode = ref(1);
const sortBy = ref('');

const component = inject<typeof component>('component');

const sortKeys = computed(() => ({
	id: mainStore.t.i.captions.id,
	parent: mainStore.t.i.captions.parent,
	name: mainStore.t.i.captions.name,
	description: mainStore.t.i.captions.description,
	owner: mainStore.t.i.captions.owner,
	system: mainStore.t.i.captions.system,
	haschildren: mainStore.t.i.captions.haschildren,
}));
const groups = computed(() => adminStore.groups);

onMounted(() => {
	watch(() => sortBy.value, () => {
		adminStore.setGroupsSortBy(sortBy.value);
		adminStore.sort({what: 'groups', by: sortBy.value});
	});
	sortBy.value = adminStore.groupsSortBy;
});

const goToUser = (id: string): void => {
	const user = adminStore.users.find((u: User) => u.id === id);
	if(typeof user === 'undefined') return;
	adminStore.change({where: user, what: 'checked', to: true});
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

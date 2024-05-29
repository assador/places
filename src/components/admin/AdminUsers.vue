<template>
	<h1>{{ store.state.main.t.i.captions.users }}</h1>
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
		<div class="control-panel__checkuncheck">
			<button
				:title="store.state.main.t.i.buttons.uncheckAll"
				@click="checkAll(false)"
			>
				<img src="@/assets/icons/dark/uncheck.svg">
			</button>
			<button
				:title="store.state.main.t.i.buttons.checkAll"
				@click="checkAll(true)"
			>
				<img src="@/assets/icons/dark/check.svg">
			</button>
		</div>
		<div class="control-panel__tablemode">
			<button
				:title="store.state.main.t.i.buttons.viewTable"
				@click="tableMode = 1"
				>
				<img src="@/assets/icons/dark/list.svg">
			</button>
			<button
				:title="store.state.main.t.i.buttons.viewTiles"
				@click="tableMode = 2"
				>
				<img src="@/assets/icons/dark/tiles.svg">
			</button>
			<button
				:title="store.state.main.t.i.buttons.viewHybrid"
				@click="tableMode = 3"
			>
				<img src="@/assets/icons/dark/list_01.svg">
			</button>
		</div>
	</div>
	<div :class="'table table-' + tableMode + ' table-' + tableMode + '_7'">
		<div v-if="tableMode === 1">
			<div />
			<h3
				v-for="(value, key) in sortKeys"
				:key="key"
			>
				{{ value }}
			</h3>
		</div>
		<div
			v-for="(user, index) in users"
			:key="index"
			:class="{'active': tableMode !== 1 && user.checked}"
		>
			<div class="user-actions">
				<input
					type="checkbox"
					:checked="user.checked"
					@change="e => {
						store.commit('admin/change', {
							where: user,
							what: 'checked',
							to: e.target.checked,
						});
					}"
				>
			</div>
			<template
				v-for="(value, key) in user"
				:key="key"
			>
				<div
					v-if="
						(value !== '' || tableMode === 1) &&
						key as unknown as string !== 'id' &&
						key as unknown as string !== 'password' &&
						key as unknown as string !== 'token' &&
						key as unknown as string !== 'homeplace' &&
						key as unknown as string !== 'checked'
					"
					:class="{'active': tableMode === 1 && user.checked}"
				>
					<div v-if="tableMode !== 1">
						{{ sortKeys[key] }}
					</div>
					<div :class="{'impvalue': key as unknown as string === sortBy}">
						{{ (typeof value === 'boolean'
							? (value === true
								? store.state.main.t.i.text.yes
								: store.state.main.t.i.text.no
							)
							: value
						) }}
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export interface IAdminUsersProps {
}
const props = withDefaults(defineProps<IAdminUsersProps>(), {
});

const store = useStore();

const tableMode = ref(1);
const sortBy = ref('');

const sortKeys = computed(() => ({
	login: store.state.main.t.i.captions.login,
	name: store.state.main.t.i.captions.name,
	email: store.state.main.t.i.captions.email,
	phone: store.state.main.t.i.captions.phone,
	confirmed: store.state.main.t.i.captions.confirmed,
	confirmbefore: store.state.main.t.i.captions.confirmbefore,
}));

onMounted(() => {
	watch(() => sortBy.value, () => {
		store.dispatch('admin/setUsersSortBy', sortBy.value);
		store.dispatch('admin/sort', {what: 'users', by: sortBy.value});
	});
	sortBy.value = store.state.admin.usersSortBy;
});

const users = computed(() => store.state.admin.users);

const checkAll = (check: boolean): void => {
	for (const user of store.state.admin.users) {
		store.commit('admin/change', {
			where: user,
			what: 'checked',
			to: check,
		});
	}
}
</script>

<style lang="scss" scoped>
.control-panel {
	display: grid;
	grid-template-columns: 1fr auto auto;
	& > * {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	&__checkuncheck {
		padding-right: 24px;
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
.user-actions {
	display: flex;
	align-items: baseline;
	margin: 6px 0;
}
</style>

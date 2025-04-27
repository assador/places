<template>
	<h1>{{ mainStore.t.i.captions.users }}</h1>
	<div class="control-panel">
		<div class="control-panel__checkuncheck">
			<button
				:title="mainStore.t.i.buttons[checkedAll ? 'uncheckAll' : 'checkAll']"
				@click="checkAll(checkedAll ? false : true)"
			>
				<img
					v-if="checkedAll"
					src="@/assets/icons/dark/uncheck.svg"
				/>
				<img
					v-else
					src="@/assets/icons/dark/check.svg"
				/>
			</button>
		</div>
		<div class="control-panel__tablemode">
			<button
				:title="mainStore.t.i.buttons.viewTable"
				@click="tableMode = 1"
			>
				<img src="@/assets/icons/dark/list.svg" />
			</button>
			<button
				:title="mainStore.t.i.buttons.viewTiles"
				@click="tableMode = 2"
			>
				<img src="@/assets/icons/dark/tiles.svg" />
			</button>
			<button
				:title="mainStore.t.i.buttons.viewHybrid"
				@click="tableMode = 3"
			>
				<img src="@/assets/icons/dark/list_01.svg" />
			</button>
		</div>
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
		<div class="control-panel__actions">
			<span>{{ mainStore.t.i.captions.actions }}:</span>
			<button
				:title="mainStore.t.i.buttons.uncheckAll"
				@click="checkAll(false)"
			>
				<img src="@/assets/icons/dark/uncheck.svg" />
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
				<label>
					<input
						type="checkbox"
						:checked="user.checked"
						@change="e => {
							adminStore.change({
								where: user,
								what: 'checked',
								to: (e.target as HTMLInputElement).checked,
							});
							if (!(e.target as HTMLInputElement).checked)
								checkedAll = false
							;
						}"
					/>
				</label>
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
								? mainStore.t.i.text.yes
								: mainStore.t.i.text.no
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
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
/*
export interface IAdminUsersProps {
	prop: 0,
}
const props = withDefaults(defineProps<IAdminUsersProps>(), {
	prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();

const tableMode = ref(1);
const sortBy = ref('');

const sortKeys = computed(() => ({
	login: mainStore.t.i.captions.login,
	name: mainStore.t.i.captions.name,
	email: mainStore.t.i.captions.email,
	phone: mainStore.t.i.captions.phone,
	confirmed: mainStore.t.i.captions.confirmed,
	confirmbefore: mainStore.t.i.captions.confirmbefore,
}));

onMounted(() => {
	watch(() => sortBy.value, () => {
		adminStore.setUsersSortBy(sortBy.value);
		adminStore.sort({what: 'users', by: sortBy.value});
	});
	sortBy.value = adminStore.usersSortBy;
});

const users = computed(() => adminStore.users);

const checkedAll = ref(false);
const checkAll = (check: boolean): void => {
	for (const user of adminStore.users) {
		adminStore.change({
			where: user,
			what: 'checked',
			to: check,
		});
	}
	checkedAll.value = check;
}
</script>

<style lang="scss" scoped>
.control-panel {
	display: flex;
	gap: 24px;
	flex-wrap: nowrap;
	& > * {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	button {
		min-width: 32px;
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
}
</style>

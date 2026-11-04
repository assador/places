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
<!--
			<button
				:title="mainStore.t.i.buttons.viewHybrid"
				@click="tableMode = 3"
			>
				<img src="@/assets/icons/dark/list_01.svg" />
			</button>
-->
		</div>
		<div class="control-panel__sortby">
			<span>{{ mainStore.t.i.captions.srt }}:</span>
			<select
				id="sort"
				v-model="adminStore.usersSortBy"
			>
				<option
					v-for="(field, key) in fields"
					:key="key"
					:value="key"
				>
					{{ field?.caption }}
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
	<div
		:class="`table table-${tableMode}`"
		:style="tableMode === 1 ? `grid-template-columns: auto repeat(${columnsCount+1}, auto);` : ''"
	>
		<div v-if="tableMode === 1">
			<div />
			<h3
				v-for="key in keysArray"
				:key="key"
			>
				{{ fields[key]?.caption }}
			</h3>
		</div>
		<div
			v-for="(user, index) in usersArray"
			:key="index"
			:class="{ 'active': user.checked }"
		>
			<div class="user-actions">
				<label>
					<input
						type="checkbox"
						:checked="user.checked"
						@change="e => {
							user.checked = (e.currentTarget as HTMLInputElement).checked;
							if (!(e.currentTarget as HTMLInputElement).checked)
								checkedAll = false
							;
						}"
					/>
				</label>
			</div>
			<template
				v-for="key in keysArray"
				:key="key"
			>
				<div :class="{ impvalue: key === adminStore.usersSortBy }">
					{{ getFieldValue(user, key) }}
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { User } from '@/types';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

const mainStore = useMainStore();
const adminStore = useAdminStore();

const tableMode = ref(1);

type Field<K extends keyof User> = {
	enabled: boolean;
	caption: string;
	callback?: (value: Exclude<User[K], undefined>) => unknown;
};
type Fields = {
	[K in keyof User]?: Field<K>;
};
const getFieldValue = (user: User, key: keyof User): unknown => {
	const field = fields.value[key];
	const value = user[key];

	if (field?.callback && value !== undefined) {
		return field.callback(value as never);
	}
	return typeof value === 'boolean'
		? (!value ? mainStore.t.i.text.no : mainStore.t.i.text.yes)
		: value
	;
};
const formatUTC = (timestamp: number): string => {
	const date = new Date(timestamp);
	return date.toLocaleString(undefined, {
		timeZone: 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}
const fields = ref<Fields>({
	login         : { enabled: true, caption: mainStore.t.i.captions.login },
	name          : { enabled: true, caption: mainStore.t.i.captions.person },
	email         : { enabled: true, caption: mainStore.t.i.captions.email },
	phone         : { enabled: true, caption: mainStore.t.i.captions.phone },
	confirmed     : { enabled: true, caption: mainStore.t.i.captions.confirmed },
	confirmbefore : {
		enabled: true,
		caption: mainStore.t.i.captions.confirmbefore,
		callback: formatUTC,
	},
});
const keysArray = computed(() => Object.keys(fields.value) as (keyof typeof fields.value)[]);

const usersArray = computed(() => {
	return (adminStore.getSorted({ what: 'users', by: adminStore.usersSortBy }) as User[]);
});

const columnsCount = computed(() => {
	return Object.values(fields.value).reduce((count, field) => {
		return field?.enabled ? count + 1 : count;
	}, 0);
});

const checkedAll = ref(false);
const checkAll = (check: boolean): void => {
	for (const id in adminStore.users) {
		if (!Object.hasOwn(adminStore.users, id)) continue;
		adminStore.users[id].checked = check;
	}
	checkedAll.value = check;
}
</script>

<style lang="scss" scoped>
h1, h3 {
	margin: 0;
}
.control-panel {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
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
	margin-top: 12px;
	padding: 6px;
	overflow: auto;
	.impvalue {
		margin-top: -0.3rem;
		font-size: 1.5rem;
	}
}
.user-actions {
	display: flex;
}
</style>

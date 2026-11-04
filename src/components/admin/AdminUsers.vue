<template>
	<div class="admin-users__header">
		<h1 class="margin_bottom_0">{{ mainStore.t.i.captions.users }}</h1>
		<div class="control-panel">
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
	</div>
	<div
		:class="`table table-${tableMode}`"
		:style="
			tableMode === 1
				? `grid-template-columns: auto repeat(${keysArray.length}, auto);`
				: null
		"
	>
		<div v-if="tableMode === 1">
			<div>
				<input
					type="checkbox"
					:checked="checked === 1"
					.indeterminate="checked === 2"
					:title="mainStore.t.i.buttons[checked ? 'uncheckAll' : 'checkAll']"
					@change="checkAll(!checked)"
				/>
			</div>
			<h3
				v-for="key in keysArray"
				:key="key"
				class="margin_bottom_0"
			>
				<button
					v-if="fields[key]"
					class="link"
					@click="adminStore.usersSortBy = key"
				>
					{{ fields[key].caption }}
				</button>
			</h3>
		</div>
		<div
			v-for="(user, index) in usersArray"
			:key="index"
			:class="{ 'active': user.checked }"
		>
			<div class="user-actions">
				<input
					type="checkbox"
					:checked="user.checked"
					@change="e => user.checked = (e.currentTarget as HTMLInputElement).checked"
				/>
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
	formatter?: (value: Exclude<User[K], undefined>) => unknown;
};
type Fields = {
	[K in keyof User]?: Field<K>;
};
const getFieldValue = (user: User, key: keyof User): unknown => {
	const field = fields.value[key];
	const value = user[key];

	if (field?.formatter && value !== undefined) {
		return field.formatter(value as never);
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
		enabled   : true,
		caption   : mainStore.t.i.captions.confirmbefore,
		formatter : formatUTC,
	},
});
const keysArray = computed(() =>
	(Object.keys(fields.value) as (keyof User)[])
		.filter(key => fields.value[key]?.enabled)
);

const usersArray = computed(() => {
	return (adminStore.getSorted({ what: 'users', by: adminStore.usersSortBy }) as User[]);
});

const check = (id: string, val: boolean): void => {
	adminStore.users[id].checked = val;
}
const checked = computed((): number => {
	let prev: boolean | undefined;
	for (const id in adminStore.users) {
		if (!Object.hasOwn(adminStore.users, id)) continue;
		const current = Boolean(adminStore.users[id].checked);
		if (prev === undefined) {
			prev = current;
			continue;
		} else {
			if (current !== prev) return 2;
		}
		prev = current;
	}
	return Number(prev);
});
const checkAll = (val: boolean): void => {
	for (const id in adminStore.users) {
		if (!Object.hasOwn(adminStore.users, id)) continue;
		check(id, val);
	}
}
</script>

<style lang="scss" scoped>
.admin-users {
	&__header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		align-items: center;
	}
}
.control-panel {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	button:not(:where(.link)) {
		min-width: 32px;
	}
}
.table {
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

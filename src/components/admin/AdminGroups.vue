<template>
	<div class="admin-groups__header">
		<h1 class="margin_bottom_0">{{ mainStore.t.i.captions.groups }}</h1>
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
		<div>
			<div>
				<input
					type="checkbox"
					:checked="checked === 1"
					.indeterminate="checked === 2"
					:title="mainStore.t.i.buttons[checked ? 'uncheckAll' : 'checkAll']"
					@change="checkAll(checked === 2 ? true : !checked)"
				/>
			</div>
			<h3
				v-for="key in keysArray"
				:key="key"
				class="table-column-caption margin_bottom_0"
				@click="sortBy(key)"
			>
				<div
					class="icon icon-triangle"
					:class="isReverse ? 'icon-triangle_down' : 'icon-triangle_up'"
				/>
				<button
					v-if="fields[key]"
					class="link"
				>
					{{ fields[key].caption }}
				</button>
			</h3>
		</div>
		<div
			v-for="n in groupsArray.length"
			:key="getGroup(n).id"
			:class="{ 'active': getGroup(n).checked }"
			@click="getGroup(n).checked = !getGroup(n).checked"
		>
			<div class="group-actions">
				<input
					type="checkbox"
					:checked="getGroup(n).checked"
				/>
			</div>
			<template
				v-for="key in keysArray"
				:key="key"
			>
				<div :class="{ impvalue: key === adminStore.groupsSortBy }">
					{{ getFieldValue(getGroup(n), key) }}
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Group } from '@/types';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

const mainStore = useMainStore();
const adminStore = useAdminStore();

const tableMode = ref(1);
const isReverse = ref(false);

type Field<K extends keyof Group> = {
	enabled: boolean;
	caption: string;
	formatter?: (value: Exclude<Group[K], undefined>) => unknown;
};
type Fields = {
	[K in keyof Group]?: Field<K>;
};

const fields = ref<Fields>({
	id          : { enabled: true, caption: mainStore.t.i.captions.id },
	parent      : { enabled: true, caption: mainStore.t.i.captions.parent },
	name        : { enabled: true, caption: mainStore.t.i.captions.name },
	description : { enabled: true, caption: mainStore.t.i.captions.description },
	owner       : { enabled: true, caption: mainStore.t.i.captions.owner },
	system      : { enabled: true, caption: mainStore.t.i.captions.system },
	haschildren : { enabled: true, caption: mainStore.t.i.captions.haschildren },
});

const keysArray = computed(() =>
	(Object.keys(fields.value) as (keyof Group)[])
		.filter(key => fields.value[key]?.enabled)
);
const groupsArray = computed(() => {
	return (adminStore.getSorted({ what: 'groups', by: adminStore.groupsSortBy }) as Group[]);
});

const getGroup = (n: number) =>
	groupsArray.value[isReverse.value ? groupsArray.value.length - n : n - 1]
;
const getFieldValue = (group: Group, key: keyof Group): unknown => {
	const field = fields.value[key];
	const value = group[key];

	if (field?.formatter && value !== undefined) {
		return field.formatter(value as never);
	}
	return typeof value === 'boolean'
		? (!value ? mainStore.t.i.text.no : mainStore.t.i.text.yes)
		: value
	;
};

const check = (id: string, val: boolean): void => {
	adminStore.groups[id].checked = val;
};
const checked = computed((): number => {
	let prev: boolean | undefined;
	for (const id in adminStore.groups) {
		if (!Object.hasOwn(adminStore.groups, id)) continue;
		const current = Boolean(adminStore.groups[id].checked);
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
	for (const id in adminStore.groups) {
		if (!Object.hasOwn(adminStore.groups, id)) continue;
		check(id, val);
	}
};
const sortBy = (key: keyof Group): void => {
	if (key !== adminStore.groupsSortBy) {
		adminStore.groupsSortBy = key;
	} else {
		isReverse.value = !isReverse.value;
	}
};
</script>

<style lang="scss" scoped>
.admin-groups {
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
.icon-triangle {
	flex: 0 0 10px;
	width: 10px; height: 10px;
	min-width: 0; min-height: 0;
	line-height: 0;
	&::before {
		background-color: var(--color-23);
	}
}
.table {
	overflow: auto;
	.impvalue {
		margin-top: -0.3rem;
		font-size: 1.5em;
	}
	&-column-caption {
		display: flex;
		gap: 8px;
		align-items: baseline;
		cursor: pointer;
	}
	& > * {
		cursor: pointer;
	}
	&.table-2 > * > :first-child {
		margin-bottom: 12px;
	}
}
.group-actions {
	display: flex;
}
</style>

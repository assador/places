<template>
	<h1>Пользователи</h1>
	<div class="control-panel">
		<div class="control-panel__sortby">
			<span>Сортировать по:</span>
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
	<div :class="'table table-' + tableMode + ' table-' + tableMode + '_6'">
		<div v-if="tableMode === 1">
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
		>
			<template
				v-for="(value, key) in user"
				:key="key"
			>
				<div
					v-if="
						(value || tableMode === 1) &&
						key as unknown as string !== 'id' &&
						key as unknown as string !== 'password' &&
						key as unknown as string !== 'token' &&
						key as unknown as string !== 'homeplace'
					"
				>
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
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { User } from '@/store/types';

export interface IAdminUsersProps {
	asd?: string;
}
const props = withDefaults(defineProps<IAdminUsersProps>(), {
	asd: '',
});

const store = useStore();

const tableMode = ref(1);

const sortKeys = {
	login: 'Логин',
	name: 'Имя',
	email: 'e-mail',
	phone: 'Телефон',
	confirmed: 'Подтверждён',
	confirmbefore: 'Подтвердить до',
};
const sortBy = ref('login');

watch(() => sortBy.value, () => {
	sortUsers(users);
});

const sortUsers = (result) => {
	result.value.sort((a, b) => {
		const nameA = a[sortBy.value].toUpperCase();
		const nameB = b[sortBy.value].toUpperCase();
		if (nameA < nameB) return -1;
		if (nameA > nameB) return 1;
		return 0;
	});
}
const getUsers = async (result) => {
	axios.post('/backend/get_users.php', {
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
				result.value = response.data as User[];
				sortUsers(result);
			}
		})
	;
}
const users = ref([]);
onMounted(() => {
	getUsers(users);
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

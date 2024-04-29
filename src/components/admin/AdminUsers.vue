<template>
	<h1>Пользователи</h1>
	Сортировать по: <select
		id="sort"
		v-model="sortBy"
	>
		<option
			v-for="key in sortKeys"
			:key="key"
			:value="key"
		>
			{{ key }}
		</option>
	</select>
	<div class="table-2">
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
						value &&
						key as unknown as string !== 'id' &&
						key as unknown as string !== 'password' &&
						key as unknown as string !== 'token' &&
						key as unknown as string !== 'homeplace'
					"
				>
					<div>{{ key }}</div>
					<div :class="{'table-2__impvalue': key as unknown as string === sortBy}">
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

const sortKeys = [
	'login',
	'name',
	'email',
	'phone',
	'confirmed',
	'confirmbefore',
];
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

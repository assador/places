<template>
	<div
		v-if="
			!!mainStore.user &&
			!!adminStore.groups.find(
				g => g.parent === 'management'
			)
		"
	>
		<div
			id="grid"
		>
			<div
				id="top-left"
				class="app-cell fieldwidth_100"
			/>
			<div
				id="top-basic"
				class="app-cell"
			>
				<places-header />
				<div
					id="messages"
					class="invisible"
					@mouseover="mainStore.setMouseOverMessages(true)"
					@mouseout="mainStore.setMouseOverMessages(false)"
					@click="mainStore.clearMessages();"
				>
					<div
						v-for="(message, index) in mainStore.messages"
						:id="'message-' + index"
						:key="index"
						class="message border_1"
					>
						{{ message }}
					</div>
				</div>
			</div>
			<div
				id="top-right"
				class="app-cell"
			>
				<div class="control-buttons">
					<button
						class="actions-button"
						:title="mainStore.t.i.hints.home"
						@click="router.push('/home')"
					>
						<span>⌂</span>
						<span>{{ mainStore.t.i.buttons.home }}</span>
					</button>
					<button
						class="actions-button"
						:title="mainStore.t.i.hints.exit"
						@click="exit()"
					>
						<span>↪</span>
						<span>{{ mainStore.t.i.buttons.exit }}</span>
					</button>
				</div>
			</div>
			<div
				id="basic-left"
				class="app-cell"
			>
				<div class="control-buttons" />
			</div>
			<div
				id="basic-basic"
				class="app-cell"
			>
				<div id="admin-basic">
					<component :is="components[component].component" />
				</div>
			</div>
			<div
				id="basic-right"
				class="app-cell"
			>
				<admin-navigation />
			</div>
			<div
				id="bottom-left"
				class="app-cell"
			>
				<div class="control-buttons" />
			</div>
			<div
				id="bottom-basic"
				class="app-cell"
			/>
			<router-view />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';;
import { useAdminStore } from '@/stores/admin';;
import { useRouter } from 'vue-router';
import { constants } from '@/shared/constants';
//import { User, Group } from '@/store/types';
import axios from 'axios';
import PlacesHeader from '@/components/PlacesHeader.vue';
import AdminNavigation from './admin/AdminNavigation.vue';
/*
export interface IPlacesAdminProps {
	prop: 0,
}
const props = withDefaults(defineProps<IPlacesAdminProps>(), {
	prop: 0,
});
*/
const mainStore = useMainStore();
const adminStore = useAdminStore();
const router = useRouter();

const getUsers = async () => {
	axios.post('/backend/get_users.php', {
		user: {
			id: sessionStorage.getItem('places-userid'),
			password: mainStore.user.password,
		},
	})
	.then(response => {
		switch (response.data) {
			case false :
				throw new Error('Administrator’s password failed the verification');
				return;
			default :
				adminStore.setUsers(response.data);
			}
		})
	;
};
provide('getUsers', getUsers);

const getGroups = async () => {
	axios.post('/backend/get_allgroups.php', {
		user: {
			id: sessionStorage.getItem('places-userid'),
			password: mainStore.user.password,
		},
	})
	.then(response => {
		switch (response.data) {
			case false :
				throw new Error('Administrator’s password failed the verification');
				return;
			default :
				adminStore.setGroups(response.data);
			}
		})
	;
};
provide('getGroups', getGroups);

onMounted(() => {
	getUsers();
	getGroups();
})

const exit = async (): Promise<void> => {
	router.push({name: 'PlacesAuth'});
	mainStore.unload();
};

const component = ref('users');
provide('component', component);

const components = {
	users: {
		name: 'AdminUsers',
		component: defineAsyncComponent(() => import('./admin/AdminUsers.vue')),
	},
	groups: {
		name: 'AdminGroups',
		component: defineAsyncComponent(() => import('./admin/AdminGroups.vue')),
	},
};
</script>

<style lang="scss" scoped>
#grid {
	grid-template-areas:
		"top-basic     top-right"
		"basic-basic   basic-right"
	;
	grid-template-columns: 1fr auto;
	grid-template-rows: auto 1fr;
}
#top-left, #basic-left, #bottom-left, #bottom-basic, #bottom-right {
	display: none;
}
#admin-basic {
	position: absolute;
	top: 0; right: 0; bottom: 0; left: 0;
	display: grid;
	grid-template-rows: auto auto 1fr;
	> * {
		padding: 12px;
	}
}
</style>

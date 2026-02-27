<template>
	<div
		v-if="
			!!mainStore.user &&
			!!adminStore.groups.find(
				g => g.parent === 'management'
			)
		"
	>
		<div id="grid">
			<div id="top-basic" class="app-cell">
				<Header />
				<div
					id="messages"
					class="invisible"
					@mouseenter="mainStore.messagesMouseOver = true"
					@mouseleave="() => {
						mainStore.messagesMouseOver = false;
						mainStore.clearMessages();
					}"
					@click="mainStore.clearMessages(true)"
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
			<div id="top-right" class="app-cell">
				<div class="control-buttons">
					<button
						class="action-button"
						:title="mainStore.t.i.hints.home"
						@click="router.push('/home')"
					>
						<span>⌂</span>
						<span>{{ mainStore.t.i.buttons.home }}</span>
					</button>
					<button
						class="action-button"
						:title="mainStore.t.i.hints.exit"
						@click="exit()"
					>
						<span>↪</span>
						<span>{{ mainStore.t.i.buttons.exit }}</span>
					</button>
				</div>
			</div>
			<div id="basic-basic" class="app-cell">
				<div id="admin-basic">
					<component :is="components[component].component" />
				</div>
			</div>
			<div id="basic-right" class="app-cell">
				<AdminNavigation />
			</div>
			<router-view />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import { useRouter } from 'vue-router';
import api from '@/api';
import Header from '@/components/Header.vue';
import AdminNavigation from '@/components/admin/AdminNavigation.vue';

const mainStore = useMainStore();
const adminStore = useAdminStore();
const router = useRouter();

const getUsers = async () => {
	const { data } = await api.post('get_users.php', {
		user: {
			id: localStorage.getItem('places-useruuid'),
			password: mainStore.user.password,
		},
	}, { silent: true });
	switch (data) {
		case false :
			throw new Error('Administrator’s password failed the verification');
		default :
			adminStore.setUsers(data);
	}
};
provide('getUsers', getUsers);

const getGroups = async () => {
	const { data } = await api.post('get_allgroups.php', {
		user: {
			id: localStorage.getItem('places-useruuid'),
			password: mainStore.user.password,
		},
	}, { silent: true });
	switch (data) {
		case false :
			throw new Error('Administrator’s password failed the verification');
		default :
			adminStore.setGroups(data);
	}
};
provide('getGroups', getGroups);

onMounted(() => {
	getUsers();
	getGroups();
})

const exit = async (): Promise<void> => {
	mainStore.unload();
	router.push({name: 'Auth'});
};

const component = ref('users');
provide('component', component);

const components = {
	users: {
		name: 'AdminUsers',
		component: defineAsyncComponent(() =>
			import('@/components/admin/AdminUsers.vue')
		),
	},
	groups: {
		name: 'AdminGroups',
		component: defineAsyncComponent(() =>
			import('@/components/admin/AdminGroups.vue')
		),
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
	#top-basic {
		grid-area: top-basic;
	}
	#top-right {
		grid-area: top-right;
		display: block !important;
	}
	#basic-basic {
		grid-area: basic-basic;
	}
	#basic-right {
		grid-area: basic-right;
	}
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
@media screen and (max-width: 800px) {
	#grid {
		grid-template-areas:
			"top-basic    top-basic"
			"basic-right  top-right"
			"basic-basic  basic-basic"
		;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto 1fr;
		#basic-right nav {
			display: flex;
			flex-flow: row wrap;
			gap: 8px;
			& > * {
				flex: 1 1 auto;
				align-items: center;
				justify-content: center;
				box-sizing: border-box;
				min-width: 50px;
				min-height: 30px;
				margin: 0;
				padding-top: 0;
				padding-bottom: 0;
			}
		}
	}
}
</style>

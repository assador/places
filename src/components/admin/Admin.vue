<template>
	<div v-if="mainStore.user?.groups?.admins">
		<div id="grid">
			<div id="top-basic" class="app-cell">
				<Header />
				<Messages />
			</div>
			<div id="top-right" class="app-cell">
				<div class="control-buttons">
					<button
						id="actions-home"
						class="action-button"
						:title="mainStore.t.i.buttons.home"
						@click="router.push('/home')"
					>
						<span class="icon icon-undo" />
						<span>{{ mainStore.t.i.buttons.home }}</span>
					</button>
					<button
						id="actions-exit"
						class="action-button"
						:title="mainStore.t.i.hints.exit"
						@click="() => {
							$nextTick(async () => {
								if (await logout()) router.push({ name: 'Auth' });
							});
						}"
					>
						<span class="icon icon-exit" />
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
import { ref, defineAsyncComponent, provide, onMounted, type Component } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import { useRouter } from 'vue-router';
import { logout } from '@/services/auth';
import Header from '@/components/Header.vue';
import Messages from '@/components/Messages.vue';
import AdminNavigation from '@/components/admin/AdminNavigation.vue';

const mainStore = useMainStore();
const adminStore = useAdminStore();
const router = useRouter();

onMounted(() => {
	adminStore.setUsers();
	adminStore.setGroups();
})

const component = ref('users');
provide('component', component);

const components: Record<string, { name: string, component: Component }> = {
	settings: {
		name: 'AdminSettings',
		component: defineAsyncComponent(() =>
			import('@/components/admin/AdminSettings.vue')
		),
	},
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
}
#admin-basic {
	position: absolute;
	top: 0; right: 0; bottom: 0; left: 0;
	display: grid;
	grid-template-rows: auto auto 1fr;
	gap: 12px;
	padding: 12px;
}
#basic-right nav > * {
	margin-bottom: 8px;
	cursor: pointer;
}
.control-buttons .action-button {
	flex-basis: calc(50% - 4px);
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
		#top-right {
			display: block;
		}
		#basic-right {
			margin: 0;
			padding: 12px;
			nav {
				display: flex;
				flex-flow: row wrap;
				gap: 8px;
				& > * {
					flex: 1 1 auto;
					display: flex;
					align-items: center;
					justify-content: center;
					min-width: 50px;
					min-height: 30px;
					margin: 0;
					padding-top: 0;
					padding-bottom: 0;
				}
			}
		}
	}
}
</style>

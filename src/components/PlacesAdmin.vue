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
			:style="compact ? ('grid-template-columns: ' + sidebarSize.left + 'px auto; grid-template-rows: auto ' + sidebarSize.top + 'px 1fr ' + (compact === -1 ? '1fr' : (sidebarSize.bottom + (typeof(sidebarSize.bottom) === 'number' ? 'px' : ''))) + ' auto;') : ('grid-template-rows: ' + sidebarSize.top + 'px 1fr ' + sidebarSize.bottom + 'px; grid-template-columns: ' + sidebarSize.left + 'px 1fr ' + sidebarSize.right + 'px;')"
			@mousemove="e => documentMouseOver(e)"
			@touchmove="e => documentMouseOver(e)"
			@mouseup="sidebarDragStop"
			@touchend="sidebarDragStop"
		>
			<div
				id="top-left"
				class="app-cell fieldwidth_100"
			/>
			<div
				id="top-basic"
				class="app-cell"
			>
				<div id="top-basic-content">
					<div class="brand">
						<h1 class="basiccolor margin_bottom_0">
							{{ mainStore.t.i.brand.header }} —
							<router-link to="/account">
								{{ mainStore.user ? mainStore.user.login : 'o_O' }}
							</router-link>
						</h1>
						<div>{{ mainStore.t.i.brand.slogan }}</div>
					</div>
					<places-dashboard />
				</div>
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
						{{ mainStore.messages[index] }}
					</div>
				</div>
			</div>
			<div
				id="top-right"
				class="app-cell"
			>
				<div class="control-buttons">
					<button
						id="actions-home"
						class="actions-button"
						:title="mainStore.t.i.hints.exit"
						@click="router.push('/home')"
					>
						<span>⌂</span>
						<span>{{ mainStore.t.i.buttons.home }}</span>
					</button>
					<button
						id="actions-exit"
						class="actions-button"
						:title="mainStore.t.i.hints.exit"
						@click="exit"
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
				<div
					id="sbs-top"
					:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
					@mousedown="e => sidebarDragStart(e, 'top')"
					@touchstart="e => sidebarDragStart(e, 'top')"
				/>
				<div
					id="sbs-right"
					:style="'top: -' + (sidebarSize.top + (compact ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
					@mousedown="e => sidebarDragStart(e, 'right')"
					@touchstart="e => sidebarDragStart(e, 'right')"
				/>
				<div
					id="sbs-bottom"
					:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
					@mousedown="e => sidebarDragStart(e, 'bottom')"
					@touchstart="e => sidebarDragStart(e, 'bottom')"
				/>
				<div
					id="sbs-left"
					:style="'top: -' + (sidebarSize.top + (compact as number > 500 ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
					@mousedown="e => sidebarDragStart(e, 'left')"
					@touchstart="e => sidebarDragStart(e, 'left')"
				/>
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
import PlacesDashboard from './PlacesDashboard.vue';
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
const compact = ref(false as boolean | number);

const sidebarSize = ref({
	top: constants.sidebars.top,
	right: constants.sidebars.right,
	bottom: constants.sidebars.bottom,
	left: constants.sidebars.left,
});
const sidebarDrag = ref({what: null as unknown, x: 0, y: 0, w: 0, h: 0});

const windowResize = (): void => {
	if (window.innerWidth > constants.compactWidth) {
		sidebarSize.value.top = constants.sidebars.top;
		sidebarSize.value.right = constants.sidebars.right;
		sidebarSize.value.bottom = constants.sidebars.bottom;
		sidebarSize.value.left = constants.sidebars.left;
		document.getElementById('sbs-left')!.style.marginLeft = '0';
		document.getElementById('sbs-top')!.style.marginTop = '0';
		document.getElementById('sbs-bottom')!.style.marginBottom = '0';
		compact.value = false;
	} else {
		if (compact.value) {
			sidebarSize.value.top = parseInt(window.getComputedStyle(
				document.getElementById('top-right') as Element
			).height);
		}
		sidebarSize.value.right = parseInt(window.getComputedStyle(
			document.getElementById('top-right') as Element
		).width);
		(sidebarSize.value.bottom as unknown) = (compact.value
			? parseInt(window.getComputedStyle(
				document.getElementById('basic-basic') as Element
			).height)
			: '1fr'
		);
		sidebarSize.value.left = parseInt(window.getComputedStyle(
			document.getElementById('basic-left') as Element
		).width);
		document.getElementById('sbs-left')!.style.marginLeft = sidebarSize.value.left + 'px';
		document.getElementById('sbs-top')!.style.marginTop =
			-parseInt(window.getComputedStyle(
				document.getElementById('top-right') as Element
			).height) + 'px'
		;
		document.getElementById('sbs-bottom')!.style.marginBottom = sidebarSize.value.bottom + 'px';
		compact.value = true;
	}
};
const sidebarDragStart = (event: Event, what: string): void => {
	event.preventDefault();
	sidebarDrag.value.what = what;
	if ((event as TouchEvent).changedTouches) {
		sidebarDrag.value.x = (event as TouchEvent).changedTouches[0].pageX;
		sidebarDrag.value.y = (event as TouchEvent).changedTouches[0].pageY;
	} else {
		sidebarDrag.value.x = (event as MouseEvent).screenX;
		sidebarDrag.value.y = (event as MouseEvent).screenY;
	}
	switch (sidebarDrag.value.what) {
		case 'top' :
			sidebarDrag.value.h = sidebarSize.value.top;
			break;
		case 'bottom' :
			sidebarDrag.value.h = sidebarSize.value.bottom;
			break;
		case 'left' :
			sidebarDrag.value.w = sidebarSize.value.left;
			break;
		case 'right' :
			sidebarDrag.value.w = sidebarSize.value.right;
			break;
	}
};
const documentMouseOver = (event: Event): void => {
	if (sidebarDrag.value.what !== null) {
		switch (sidebarDrag.value.what) {
			case 'top' :
				sidebarSize.value.top =
					sidebarDrag.value.h - sidebarDrag.value.y +
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageY
						: (event as MouseEvent).screenY
					);
				break;
			case 'bottom' :
				sidebarSize.value.bottom =
					sidebarDrag.value.h + sidebarDrag.value.y -
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageY
						: (event as MouseEvent).screenY
					);
				break;
			case 'left' :
				sidebarSize.value.left =
					sidebarDrag.value.w - sidebarDrag.value.x +
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageX
						: (event as MouseEvent).screenX
					);
				break;
			case 'right' :
				sidebarSize.value.right =
					sidebarDrag.value.w + sidebarDrag.value.x -
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageX
						: (event as MouseEvent).screenX
					);
				break;
		}
	}
};
const sidebarDragStop = (): void => {
	sidebarDrag.value.what = null;
	if (compact.value) {
		windowResize();
	}
};

const exit = async (): Promise<void> => {
	mainStore.unload();
	router.push({name: 'PlacesAuth'});
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
	!important;
	grid-template-columns: 1fr auto !important;
	grid-template-rows: auto 1fr !important;
}
#top-left, #basic-left, #bottom-left, #bottom-basic, #bottom-right {
	display: none;
}
#top-right {
	min-height: 100px;
}
@media screen and (max-width: 850px) {
	#grid {
		grid-template-areas:
			"top-basic   top-right"
			"basic-right basic-right"
			"basic-basic basic-basic"
		!important;
		grid-template-columns: 1fr auto !important;
		grid-template-rows: auto auto 1fr !important;
	}
	#basic-left, #bottom-left, #bottom-basic {
		display: none;
	}
}
@media screen and (max-width: 570px) {
	#grid {
		grid-template-areas:
			"top-basic   top-basic"
			"basic-right top-right"
			"basic-basic basic-basic"
		!important;
		grid-template-columns: 1fr auto !important;
		grid-template-rows: auto auto 1fr !important;
	}
}
.control-buttons {
	position: relative;
	margin: -4px;
	grid-template-columns: repeat(2, 1fr);
}
#admin-basic {
	position: absolute;
	top: 12px; right: 12px; bottom: 12px; left: 12px;
}
</style>

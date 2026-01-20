<template>
	<div class="header">
		<div class="brand">
			<h1 class="basiccolor margin_bottom_0">
				{{ mainStore.t.i.brand.header }} —
				<span class="brand-login">
					<Popup
						:show="popuped"
						:closeOnClick="false"
						class="messages fontsize_n"
						@update:show="popuped = $event"
					>
						<template v-slot:slot>
							<router-link
								to="/account"
								class="menu-link message border_1"
							>
								{{ mainStore.t.i.buttons.profile }}
							</router-link>
							<router-link
								v-if="
									!!mainStore['user'] &&
									!!mainStore.user['groups'] &&
									!!mainStore.user['groups'].find(
										g => g.parent === 'management'
									)
								"
								to="/admin"
								class="menu-link message border_1"
							>
								{{ mainStore.t.i.captions.admin }}
							</router-link>
							<a
								href="javascript:void(0)"
								class="menu-link message border_1"
								@click="emitter.emit('logout')"
							>
								{{ mainStore.t.i.buttons.exit }}
							</a>
						</template>
					</Popup>
				</span>
				<a href="javascript:void(0)" @click="popuped = !popuped">
					{{
						mainStore.user
							? (mainStore.user.name
								? mainStore.user.name
								: mainStore.user.login
							)
							: 'o_O'
					}}
				</a>
			</h1>
			<div>{{ mainStore.t.i.brand.slogan }}</div>
		</div>
		<Dashboard />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { emitter } from '@/shared';
import { useMainStore } from '@/stores/main';
import Dashboard from '@/components/Dashboard.vue';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();

const popuped = ref(false);
</script>

<style lang="scss" scoped>
.header {
	display: grid;
	grid-template-columns: 1fr auto;
}
.brand-login {
	display: inline-block;
	position: relative;
	.menu-link {
		display: block;
	}
}
.admin-link {
	position: relative;
	top: -10px; left: 5px;
	font-size: 55%;
	text-transform: lowercase;
}
</style>

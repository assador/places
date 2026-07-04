<template>
	<div class="header">
		<div class="brand">
			<h1 class="basiccolor margin_bottom_0">
				{{ mainStore.t.i.brand.header }} —
				<span class="brand-login">
					<Popup
						:show="popupProps.show"
						:position="popupProps.position"
						:closeOnClick="false"
						class="messages fontsize_n"
						@update:show="popupProps.show = $event"
					>
						<template #popupSlot>
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
								@click="() => { logout(); router.push({ name: 'Auth' }); }"
							>
								{{ mainStore.t.i.buttons.exit }}
							</a>
						</template>
					</Popup>
				</span>
				<a
					href="javascript:void(0)"
					@pointerdown.stop.prevent="e => {
						if (popupProps.show) {
							popupProps.show = false;
						}
						else {
							popupProps.position = calculatePopupPosition(e);
							popupProps.show = true;
						}
					}"
					@contextmenu.stop.prevent
				>
					{{
						mainStore.user?.name ? mainStore.user.name
						: mainStore.user?.login ? mainStore.user.login
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
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { PopupProps } from '@/types';
import { logout } from '@/services/auth';
import { calculatePopupPosition } from '@/shared/common';
import Dashboard from '@/components/Dashboard.vue';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();
const router = useRouter();

const popupProps = ref<PopupProps>({
	show: false,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});
</script>

<style lang="scss" scoped>
.header {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 12px;
}
.brand-login {
	display: inline-block;
	position: relative;
}
</style>

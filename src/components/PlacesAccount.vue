<template>
	<div class="account centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				{{ mainStore.t.i.brand.header }}
			</h1>
			<p>{{ mainStore.t.i.captions.accountPage }}</p>
		</div>
		<form
			class="account__form"
			@submit.prevent="accountSubmit"
		>
			<table class="table_form">
				<tbody>
					<tr>
						<th>{{ mainStore.t.i.captions.login }}:</th>
						<td colspan="2">
							<input
								id="accountLogin"
								v-model="accountLogin"
								class="fieldwidth_100"
								required
								type="text"
								:placeholder="mainStore.t.i.inputs.regLogin"
							>
						</td>
					</tr>
					<tr>
						<th>{{ mainStore.t.i.captions.newPassword }}:</th>
						<td colspan="2">
							<input
								id="accountNewPassword"
								v-model="accountNewPassword"
								class="fieldwidth_100"
								type="password"
								:placeholder="mainStore.t.i.inputs.needToChangePassword"
							>
						</td>
					</tr>
					<tr>
						<th>{{ mainStore.t.i.captions.repeatNewPassword }}:</th>
						<td colspan="2">
							<input
								id="accountNewPasswordRepeat"
								v-model="accountNewPasswordRepeat"
								class="fieldwidth_100"
								type="password"
								:placeholder="mainStore.t.i.inputs.needToChangePassword"
							>
						</td>
					</tr>
					<tr>
						<th>{{ mainStore.t.i.inputs.regAddressBy }}:</th>
						<td colspan="2">
							<input
								id="accountName"
								v-model="accountName"
								class="fieldwidth_100"
								type="text"
								:placeholder="mainStore.t.i.inputs.regAddressBy"
							>
						</td>
					</tr>
					<tr>
						<th>e-mail:</th>
						<td colspan="2">
							<input
								id="accountEmail"
								v-model="accountEmail"
								class="fieldwidth_100"
								required
								type="text"
								placeholder="e-mail *"
							>
						</td>
					</tr>
					<tr>
						<th>{{ mainStore.t.i.captions.phone }}:</th>
						<td colspan="2">
							<input
								id="accountPhone"
								v-model="accountPhone"
								class="fieldwidth_100"
								type="text"
								:placeholder="mainStore.t.i.captions.phone"
							>
						</td>
					</tr>
					<tr class="back_0">
						<th />
						<td style="padding-top: 18px; vertical-align: top;">
							<button type="submit">
								{{ mainStore.t.i.buttons.save }}
							</button>
							&#160;
							<button
								type="button"
								@click="e => close(e)"
							>
								{{ mainStore.t.i.buttons.back }}
							</button>
						</td>
						<td style="padding-top: 18px; vertical-align: top; text-align: right;">
							<button
								type="button"
								@click="router.push(
									{name: 'PlacesAccountDelete'}
								).catch(e => {console.error(e);})"
							>
								{{ mainStore.t.i.buttons.deleteAccount }}
							</button>
						</td>
					</tr>
					<tr class="back_0">
						<th />
						<td
							colspan="2"
							style="padding-top: 18px;"
						>
							{{ account.message }}
						</td>
					</tr>
				</tbody>
			</table>
		</form>
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated, onBeforeUnmount, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';;
import { useRouter } from 'vue-router';
import { constants } from '../shared/constants';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { accountSaveRoutine, acc } from '../shared/account';

const mainStore = useMainStore();
const router = useRouter();

const accountLogin = ref(mainStore.user.login);
const accountNewPassword = ref('');
const accountNewPasswordRepeat = ref('');
const accountName = ref(mainStore.user.name);
const accountEmail = ref(mainStore.user.email);
const accountPhone = ref(mainStore.user.phone);
const account = ref(acc);

onMounted(async () => {
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	document.addEventListener('keyup', keyup, false);
});
onUpdated(() => {
	makeFieldsValidatable(mainStore.t);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.push({name: 'PlacesHome'});
};
const keyup = (event: Event): void => {
	if (
		(constants.shortcuts as Record<string, string>)
			[(event as KeyboardEvent).keyCode] === 'close'
	) close(event);
};
const accountSubmit = function(): void {
	if (mainStore.user.testaccount) {
		account.value.message = mainStore.t.m.paged.taCannotBeChanged;
	} else {
		if (!document.querySelector('.value_wrong')) {
			const {
				accountLogin,
				accountNewPassword,
				accountNewPasswordRepeat,
				accountName,
				accountEmail,
				accountPhone,
			} = this;
			if (accountNewPassword === accountNewPasswordRepeat) {
				const accountId = sessionStorage.getItem('places-userid') as string;
				accountSaveRoutine({
					accountId,
					accountLogin,
					accountNewPassword,
					accountName,
					accountEmail,
					accountPhone,
				}, mainStore.t);
			} else {
				account.value.message = mainStore.t.m.paged.passwordsNotMatch;
			}
		} else {
			account.value.message = mainStore.t.m.paged.incorrectFields;
		}
	}
};
</script>

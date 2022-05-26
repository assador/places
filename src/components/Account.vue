<template>
	<div class="account centered">
		<div class="narrower">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ $store.state.t.i.brand.header }}
				</h1>
				<p>{{ $store.state.t.i.captions.accountPage }}</p>
			</div>
			<form
				class="account__form"
				@submit.prevent="accountSubmit"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>{{ $store.state.t.i.captions.login }}:</th>
							<td colspan="2">
								<input
									id="accountLogin"
									v-model="accountLogin"
									class="fieldwidth_100"
									required
									type="text"
									:placeholder="$store.state.t.i.inputs.regLogin"
								>
							</td>
						</tr>
						<tr>
							<th>{{ $store.state.t.i.captions.newPassword }}:</th>
							<td colspan="2">
								<input
									id="accountNewPassword"
									v-model="accountNewPassword"
									class="fieldwidth_100"
									type="password"
									:placeholder="$store.state.t.i.inputs.needToChangePassword"
								>
							</td>
						</tr>
						<tr>
							<th>{{ $store.state.t.i.captions.repeatNewPassword }}:</th>
							<td colspan="2">
								<input
									id="accountNewPasswordRepeat"
									v-model="accountNewPasswordRepeat"
									class="fieldwidth_100"
									type="password"
									:placeholder="$store.state.t.i.inputs.needToChangePassword"
								>
							</td>
						</tr>
						<tr>
							<th>{{ $store.state.t.i.inputs.regAddressBy }}:</th>
							<td colspan="2">
								<input
									id="accountName"
									v-model="accountName"
									class="fieldwidth_100"
									type="text"
									:placeholder="$store.state.t.i.inputs.regAddressBy"
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
							<th>{{ $store.state.t.i.captions.phone }}:</th>
							<td colspan="2">
								<input
									id="accountPhone"
									v-model="accountPhone"
									class="fieldwidth_100"
									type="text"
									:placeholder="$store.state.t.i.captions.phone"
								>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">
									{{ $store.state.t.i.buttons.save }}
								</button>
								&#160;
								<button
									type="button"
									@click="close($event)"
								>
									{{ $store.state.t.i.buttons.back }}
								</button>
							</td>
							<td style="padding-top: 18px; vertical-align: top; text-align: right;">
								<button
									type="button"
									@click="$router.push({name: 'AccountDelete'}).catch(() => {})"
								>
									{{ $store.state.t.i.buttons.deleteAccount }}
								</button>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td
								colspan="2"
								style="padding-top: 18px;"
							>
								{{ acc.message }}
							</td>
						</tr>
					</tbody>
				</table>
			</form>
			<router-view />
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { constants } from '../shared/constants';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { accountSaveRoutine, acc } from '../shared/account';

export default Vue.extend({
	data() {
		return {
			accountLogin: this.$store.state.user.login,
			accountNewPassword: '',
			accountNewPasswordRepeat: '',
			accountName: this.$store.state.user.name,
			accountEmail: this.$store.state.user.email,
			accountPhone: this.$store.state.user.phone,
			acc: acc,
		}
	},
	mounted() {
		this.$nextTick(() => {
			makeFieldsValidatable();
			document.addEventListener('keyup', this.keyup, false);
		});
	},
	updated() {
		makeFieldsValidatable();
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.push({name: 'Home'});
		},
		keyup(event: Event) {
			if (
				(constants.shortcuts as Record<string, string>)
					[(event as KeyboardEvent).keyCode] === 'close'
			) this.close(event);
		},
		accountSubmit() {
			if (this.$store.state.user.testaccount) {
				acc.message = this.$store.state.t.m.paged.taCannotBeChanged;
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
						});
					} else {
						acc.message = this.$store.state.t.m.paged.passwordsNotMatch;
					}
				} else {
					acc.message = this.$store.state.t.m.paged.incorrectFields;
				}
			}
		},
	},
});
</script>

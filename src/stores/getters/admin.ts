import { User } from '@/types';
import { StoreAdminStateRefs } from '@/stores/types';

export function useGettersAdmin(
	state: StoreAdminStateRefs,
) {

	const getUserById = (id: string): User | undefined => {
		return state.users.value[id];
	};

	return {
		getUserById,
	};
}

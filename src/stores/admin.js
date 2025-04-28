import { defineStore } from 'pinia';
export const useAdminStore = defineStore('admin', {
    state: () => ({
        users: [],
        groups: [],
        usersSortBy: 'login',
        groupsSortBy: 'id',
    }),
    actions: {
        change(payload) {
            payload.where[payload.what] = payload.to;
        },
        setUsersMut(payload) {
            this.users = payload;
        },
        setGroupsMut(payload) {
            this.groups = payload;
        },
        setUsersSortByMut(sortBy) {
            this.usersSortBy = sortBy;
        },
        setGroupsSortByMut(sortBy) {
            this.groupsSortBy = sortBy;
        },
        sortMut(payload) {
            this[payload.what].sort((a, b) => {
                const stringA = a[payload.by] ? a[payload.by].toString().toUpperCase() : '';
                const stringB = b[payload.by] ? b[payload.by].toString().toUpperCase() : '';
                if (stringA < stringB)
                    return -1;
                if (stringA > stringB)
                    return 1;
                return 0;
            });
        },
        setUsers(payload) {
            for (const user of payload) {
                user.confirmed = user.confirmed ? true : false;
                user.checked = false;
            }
            this.setUsersMut(payload);
        },
        setGroups(payload) {
            for (const group of payload) {
                group.haschildren = group.haschildren ? true : false;
                group.system = group.system ? true : false;
                group.checked = false;
            }
            this.setGroupsMut(payload);
        },
        setUsersSortBy(sortBy) {
            this.setUsersSortByMut(sortBy);
        },
        setGroupsSortBy(sortBy) {
            this.setGroupsSortByMut(sortBy);
        },
        sort(payload) {
            this.sortMut(payload);
        },
    },
    getters: {},
});
//# sourceMappingURL=admin.js.map
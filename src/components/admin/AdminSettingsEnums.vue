<template>
	<h2>{{ mainStore.t.i.captions.enums }}</h2>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
</script>

<style lang="scss" scoped>
</style>

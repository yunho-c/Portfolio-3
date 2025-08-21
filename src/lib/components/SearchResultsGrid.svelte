<script lang="ts">
	import SearchResult from './SearchResult.svelte';
	import { createEventDispatcher } from 'svelte';

	export let objects: { id: number; name: string; thumbnail: string }[];

	const dispatch = createEventDispatcher();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each objects as object}
		<SearchResult {object} on:click={() => dispatch('select', object)} />
	{/each}
</div>

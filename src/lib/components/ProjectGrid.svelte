<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';
	import { createEventDispatcher } from 'svelte';

	export let projects: { id: number; name: string; thumbnail: string; tags?: { name: string; icon: string }[] }[];

	const dispatch = createEventDispatcher();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each projects as project}
		<ProjectCard {project} on:click={() => dispatch('select', project)} />
	{/each}
</div>

<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';

	export let projects: { id: string; slug: string; name: string; thumbnail: string; tags?: { name: string; icon: string }[] }[];
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each projects as project}
		<ProjectCard {project} />
	{/each}
</div>

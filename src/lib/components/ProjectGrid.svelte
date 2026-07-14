<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';

	export let projects: { id: string; slug: string; name: string; thumbnail: string; tags?: { name: string; icon: string }[] }[];
	export let reveal = false;
	export let revealDelay = 0;
	export let revealInterval = 180;
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each projects as project, index}
		{#if reveal}
			<div class="project-reveal" style:--project-reveal-delay={`${revealDelay + index * revealInterval}ms`}>
				<ProjectCard {project} />
			</div>
		{:else}
			<ProjectCard {project} />
		{/if}
	{/each}
</div>

<style>
	.project-reveal {
		animation: project-rise 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: var(--project-reveal-delay);
	}

	@keyframes project-rise {
		from {
			opacity: 0;
			filter: blur(0.3rem);
			transform: translateY(2.5rem);
		}

		to {
			opacity: 1;
			filter: blur(0);
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.project-reveal {
			animation: none;
		}
	}
</style>

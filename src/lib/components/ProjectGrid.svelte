<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';

	export let projects: { id: string; slug: string; name: string; thumbnail: string; tags?: { name: string; icon: string }[] }[];
	export let reveal = false;
	export let revealVariant: 'full' | 'skip' = 'full';
	export let revealDelay = 0;
	export let revealInterval = 180;
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each projects as project, index (project.id)}
		{#if reveal}
			<div
				class:project-reveal={revealVariant === 'full'}
				class:project-skip-reveal={revealVariant === 'skip'}
				style:--project-reveal-delay={`${revealDelay + index * revealInterval}ms`}
			>
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

	.project-skip-reveal {
		animation: project-skip-rise 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
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

	@keyframes project-skip-rise {
		from {
			opacity: 0;
			filter: blur(0.2rem);
			transform: translateY(1.25rem);
		}

		to {
			opacity: 1;
			filter: blur(0);
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.project-reveal,
		.project-skip-reveal {
			animation: none;
		}
	}
</style>

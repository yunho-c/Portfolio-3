<script lang="ts">
	import InteractiveHero from '$lib/components/InteractiveHero.svelte';
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';
	import { createHeroGridCells } from '$lib/hero-grid';
	import type { PageData } from './$types';

	export let data: PageData;

	const heroGridCells = createHeroGridCells(data.heroImages, { cellImages: data.heroCollageImages });
</script>

<InteractiveHero cells={heroGridCells} activationDelay={8360}>
	<main class="mx-auto max-w-[840px] px-5 pt-24 pb-20 sm:px-6 md:pt-40 md:pb-32">
		<div class="intro-panel">
			<!-- Primary Anchor (Huge, Bold) -->
			<h1
				class="intro-line text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
				style="--intro-delay: 460ms"
			>
				Hi, nice to meet you, my name is Yunho
				<span class="pronunciation font-normal italic text-muted-foreground">('you-know')</span>.
			</h1>

			<!-- Secondary Thesis (Large, Muted with Highlighted Keywords) -->
			<p
				class="intro-line mt-8 text-2xl font-medium leading-snug text-muted-foreground sm:text-3xl"
				style="--intro-delay: 2460ms"
			>
				I am a machine learning engineer interested in foundational
				<span class="mystic-highlight text-foreground" style="--glint-delay: 4500ms">language</span>,
				<span class="mystic-highlight text-foreground" style="--glint-delay: 5100ms">vision</span>, and
				<span class="mystic-highlight text-foreground" style="--glint-delay: 5700ms"
					>human-computer interaction</span
				>
				technologies.
			</p>

			<!-- Tertiary Context (Smaller, Playful) -->
			<p
				class="intro-line mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground/80 sm:text-xl"
				style="--intro-delay: 7460ms"
			>
				I am generally interested about everything and quite
				<span class="cursor-help text-foreground transition-all duration-300 hover:blur-[3px]"
					>distracted</span
				>, which naturally leads me to work on many side projects... some of which you can check out below :)
			</p>
		</div>
	</main>
</InteractiveHero>

<div class="container mx-auto px-4 pb-20 sm:px-6 lg:px-8">
	<div class="intro-line mb-8 flex items-center justify-between" style="--intro-delay: 9460ms">
		<h3 class="text-2xl font-bold tracking-tight text-foreground">Featured Projects</h3>
		<a href="/projects" class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
			View all projects &rarr;
		</a>
	</div>
	<ProjectGrid projects={data.projects.slice(0, 4)} reveal revealDelay={9960} revealInterval={220} />
</div>

<style>
	.intro-panel {
		position: relative;
		isolation: isolate;
		transition:
			color 420ms cubic-bezier(0.22, 1, 0.36, 1),
			text-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.intro-panel::before {
		position: absolute;
		z-index: -1;
		inset: -1.25rem;
		content: '';
		pointer-events: none;
		opacity: 0;
		transform: scale(0.985);
		border: 1px solid transparent;
		border-radius: 1.75rem;
		background: linear-gradient(135deg, oklch(0.12 0.018 75 / 82%), oklch(0.08 0.012 75 / 74%));
		box-shadow: 0 1.5rem 4rem oklch(0.04 0.01 75 / 0%);
		backdrop-filter: blur(0) saturate(1);
		transition:
			opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 420ms ease,
			box-shadow 480ms ease,
			backdrop-filter 480ms ease;
	}

	:global(.interactive-hero.collage-active) .intro-panel {
		--foreground: oklch(0.97 0.012 88);
		--muted-foreground: oklch(0.87 0.018 88);
		text-shadow: 0 0.08rem 0.35rem oklch(0.03 0.01 75 / 42%);
	}

	:global(.interactive-hero.collage-active) .intro-panel::before {
		opacity: 1;
		transform: scale(1);
		border-color: oklch(0.9 0.055 84 / 18%);
		box-shadow: 0 1.5rem 4rem oklch(0.03 0.01 75 / 38%);
		backdrop-filter: blur(0.9rem) saturate(0.82);
	}

	:global(.interactive-hero.collage-active) .mystic-highlight {
		color: oklch(0.84 0.15 82) !important;
		text-shadow: 0 0 0.7rem oklch(0.78 0.14 82 / 28%);
	}

	.intro-line {
		animation: intro-awaken 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: var(--intro-delay);
	}

	.pronunciation {
		animation: secret-note-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 840ms;
	}

	.mystic-highlight {
		animation: keyword-glint 1400ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--glint-delay);
	}

	@keyframes intro-awaken {
		from {
			opacity: 0;
			filter: blur(0.65rem);
			transform: translateY(0.65rem) scale(0.995);
			text-shadow: 0 0 1.5rem oklch(0.78 0.14 82 / 45%);
		}

		60% {
			opacity: 1;
			filter: blur(0.04rem);
			text-shadow: 0 0 0.7rem oklch(0.78 0.14 82 / 16%);
		}

		to {
			opacity: 1;
			filter: blur(0);
			transform: translateY(0) scale(1);
			text-shadow: 0 0 0 transparent;
		}
	}

	@keyframes secret-note-reveal {
		from {
			opacity: 0;
			filter: blur(0.25rem);
			letter-spacing: 0.04em;
		}

		to {
			opacity: 1;
			filter: blur(0);
			letter-spacing: normal;
		}
	}

	@keyframes keyword-glint {
		0%,
		100% {
			color: var(--foreground);
			text-shadow: 0 0 0 oklch(0.78 0.14 82 / 0%);
		}

		45% {
			color: oklch(0.7 0.15 78);
			text-shadow: 0 0 0.65rem oklch(0.78 0.14 82 / 55%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.intro-panel,
		.intro-panel::before {
			transition: none;
		}

		.intro-line,
		.pronunciation,
		.mystic-highlight {
			animation: none;
		}
	}
</style>

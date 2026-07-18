<script lang="ts">
	import { onMount } from 'svelte';
	import InteractiveHero from '$lib/components/InteractiveHero.svelte';
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';
	import { createHeroGridCells } from '$lib/hero-grid';
	import { consumeHomeIntro, useUiSession } from '$lib/ui-session';
	import type { PageData } from './$types';

	export let data: PageData;

	let playIntro = consumeHomeIntro(useUiSession());
	let playSkipSequence = false;
	let introActive = playIntro;
	let skipPhase: 'idle' | 'out' | 'in' = 'idle';
	let introCompletionTimer: ReturnType<typeof setTimeout> | undefined;
	let skipTimer: ReturnType<typeof setTimeout> | undefined;

	const heroGridCells = createHeroGridCells({ cellMedia: data.heroCollageMedia });
	const featuredProjects = data.projects.slice(0, 4);
	const introDuration =
		Math.max(14040, featuredProjects.length > 0 ? 14440 + (featuredProjects.length - 1) * 220 : 0) + 100;
	const greetingWords = [
		{ text: 'Hi,', delay: 0 },
		{ text: 'nice', delay: 800 },
		{ text: 'to', delay: 920 },
		{ text: 'meet', delay: 1040 },
		{ text: 'you,', delay: 1160 },
		{ text: 'my', delay: 1960 },
		{ text: 'name', delay: 2080 },
		{ text: 'is', delay: 2200 },
		{ text: 'Yunho', delay: 2320 }
	];

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			playIntro = false;
			playSkipSequence = false;
			introActive = false;
			return;
		}

		if (introActive) {
			introCompletionTimer = setTimeout(() => {
				introActive = false;
			}, introDuration);
		}

		return () => {
			if (introCompletionTimer) clearTimeout(introCompletionTimer);
			if (skipTimer) clearTimeout(skipTimer);
		};
	});

	function skipIntro() {
		if (!introActive || skipPhase !== 'idle') return;

		if (introCompletionTimer) clearTimeout(introCompletionTimer);
		skipPhase = 'out';
		skipTimer = setTimeout(() => {
			playIntro = false;
			playSkipSequence = true;
			introActive = false;
			skipPhase = 'in';
			skipTimer = setTimeout(() => {
				skipPhase = 'idle';
			}, 220);
		}, 120);
	}

	function handleIntroPointer(event: PointerEvent) {
		if (!event.defaultPrevented && event.isPrimary && event.button === 0) skipIntro();
	}

	function handleIntroKeydown(event: KeyboardEvent) {
		if (!event.defaultPrevented && event.key === 'Escape') skipIntro();
	}
</script>

<svelte:window onpointerdown={handleIntroPointer} onkeydown={handleIntroKeydown} />

<InteractiveHero cells={heroGridCells} activationDelay={playIntro ? 12040 : 0}>
	<main
		class="mx-auto max-w-[840px] px-5 pt-24 pb-20 sm:px-6 md:pt-40 md:pb-32"
		class:intro-skip-out={skipPhase === 'out'}
		class:intro-skip-in={skipPhase === 'in'}
		data-intro-active={introActive}
	>
		<div
			class="intro-panel"
			class:play-home-intro={playIntro}
			class:play-skip-sequence={playSkipSequence}
		>
			<!-- Primary Anchor (Huge, Bold) -->
			<h1
				class="intro-part text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
				style="--intro-delay: 460ms; --skip-intro-delay: 0ms"
				aria-label="Hi, nice to meet you, my name is Yunho ('you-know')."
			>
				{#each greetingWords as word, index}
					{#if index > 0}{' '}{/if}<span
						class="written-word"
						style={`--word-delay: ${word.delay}ms`}>{word.text}</span
					>
				{/each}{' '}<span class="written-word" style="--word-delay: 3120ms"
					><span class="font-normal italic text-muted-foreground">('you-know')</span>.</span
				>
			</h1>

			<!-- Secondary Thesis (Large, Muted with Highlighted Keywords) -->
			<p
				class="intro-line intro-part mt-8 text-2xl font-medium leading-snug text-muted-foreground sm:text-3xl"
				style="--intro-delay: 4740ms; --skip-intro-delay: 90ms"
			>
				I am a machine learning engineer interested in foundational
				<span class="mystic-highlight text-foreground" style="--glint-delay: 6780ms">language</span>,
				<span class="mystic-highlight text-foreground" style="--glint-delay: 7780ms">vision</span>, and
				<span class="mystic-highlight text-foreground" style="--glint-delay: 8780ms"
					>human-computer interaction</span
				>
				technologies.
			</p>

			<!-- Tertiary Context (Smaller, Playful) -->
			<p
				class="intro-line intro-part mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground/80 sm:text-xl"
				style="--intro-delay: 11140ms; --skip-intro-delay: 180ms"
			>
				I am generally interested about everything and quite
				<span class="cursor-help text-foreground transition-all duration-300 hover:blur-[3px]"
					>distracted</span
				>, which naturally leads me to work on many side projects... some of which you can check out below :)
			</p>
		</div>
	</main>
</InteractiveHero>

<div
	class="container mx-auto px-4 pt-8 pb-20 sm:px-6 sm:pt-10 lg:px-8"
	class:intro-skip-out={skipPhase === 'out'}
	class:intro-skip-in={skipPhase === 'in'}
>
	<div
		class="intro-line mb-8 flex items-center justify-between"
		class:play-home-intro={playIntro}
		class:play-skip-projects={playSkipSequence}
		style="--intro-delay: 13140ms"
	>
		<h3 class="text-2xl font-bold tracking-tight text-foreground">Featured Projects</h3>
		<a href="/projects" class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
			View all projects &rarr;
		</a>
	</div>
	<ProjectGrid
		projects={featuredProjects}
		reveal={playIntro || playSkipSequence}
		revealVariant={playSkipSequence ? 'skip' : 'full'}
		revealDelay={playSkipSequence ? 360 : 13640}
		revealInterval={220}
	/>
</div>

<style>
	.intro-skip-out {
		opacity: 0;
		transition: opacity 120ms ease-in;
	}

	.intro-skip-in {
		opacity: 1;
		transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.play-skip-sequence .intro-part {
		animation: skip-intro-awaken 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: var(--skip-intro-delay);
	}

	.intro-line.play-skip-projects {
		animation: skip-intro-awaken 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: 280ms;
	}

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
		inset-block: -1.75rem;
		inset-inline: calc(-1 * clamp(1.25rem, 4vw, 1.75rem));
		content: '';
		pointer-events: none;
		opacity: 0;
		transform: scale(0.985);
		border-radius: 1.25rem;
		background: linear-gradient(135deg, oklch(0.12 0.018 75 / 68%), oklch(0.08 0.012 75 / 60%));
		box-shadow: 0 1.5rem 4rem oklch(0.04 0.01 75 / 0%);
		backdrop-filter: blur(0) saturate(1);
		transition:
			opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
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
		box-shadow: 0 1.5rem 4rem oklch(0.03 0.01 75 / 28%);
		backdrop-filter: blur(0.9rem) saturate(0.82);
	}

	:global(.interactive-hero.collage-active) .mystic-highlight {
		color: oklch(0.84 0.15 82) !important;
		text-shadow: 0 0 0.7rem oklch(0.78 0.14 82 / 28%);
	}

	.play-home-intro .intro-line,
	.intro-line.play-home-intro {
		animation: intro-awaken 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: var(--intro-delay);
	}

	.written-word {
		display: inline-block;
	}

	.play-home-intro .mystic-highlight {
		animation: keyword-glint 2000ms cubic-bezier(0.22, 1, 0.36, 1) both;
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

	@keyframes skip-intro-awaken {
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

	@keyframes word-inscribe {
		0% {
			opacity: 0;
			clip-path: inset(0 100% 0 0);
			filter: blur(0.3rem);
			transform: translateY(0.14em) scale(0.985);
			text-shadow: 0 0 1rem oklch(0.78 0.14 82 / 0%);
		}

		42% {
			opacity: 0.92;
			clip-path: inset(0 8% 0 0);
			filter: blur(0.1rem);
			transform: translateY(0.035em) scale(0.997);
			text-shadow: 0 0 0.8rem oklch(0.78 0.14 82 / 32%);
		}

		100% {
			opacity: 1;
			clip-path: inset(0);
			filter: blur(0);
			transform: translateY(0) scale(1);
			text-shadow: 0 0 0 transparent;
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

	@media (min-width: 40rem) {
		.intro-panel::before {
			inset-block: -2.5rem;
			inset-inline: -3rem;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.play-home-intro .written-word {
			animation: word-inscribe 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
			animation-delay: calc(var(--intro-delay) + var(--word-delay));
			transform-origin: left center;
			will-change: opacity, clip-path, filter, transform;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.intro-skip-out,
		.intro-skip-in {
			transition: none;
		}

		.intro-panel,
		.intro-panel::before {
			transition: none;
		}

		.play-home-intro .intro-line,
		.intro-line.play-home-intro,
		.play-home-intro .mystic-highlight,
		.play-skip-sequence .intro-part,
		.intro-line.play-skip-projects {
			animation: none;
		}
	}
</style>

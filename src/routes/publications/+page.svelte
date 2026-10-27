<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	const POSTER_ZOOM_MIN = 100;
	const POSTER_ZOOM_MAX = 300;
	const POSTER_ZOOM_STEP = 25;
	const POSTER_ZOOM_DURATION = 200;

	let posterZoom = $state(POSTER_ZOOM_MIN);
	let posterTargetZoom = $state(POSTER_ZOOM_MIN);
	let posterZoomAnimating = $state(false);
	let posterViewport: HTMLDivElement | null = null;
	let posterAnimationFrame: number | null = null;
	let posterAnimationVersion = 0;

	function cancelPosterZoomAnimation() {
		posterAnimationVersion += 1;
		posterZoomAnimating = false;

		if (posterAnimationFrame !== null) {
			cancelAnimationFrame(posterAnimationFrame);
			posterAnimationFrame = null;
		}
	}

	function getPosterViewportCenter(viewport: HTMLDivElement) {
		return {
			x: (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(viewport.scrollWidth, 1),
			y: (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(viewport.scrollHeight, 1)
		};
	}

	function restorePosterViewportCenter(
		viewport: HTMLDivElement,
		center: { x: number; y: number }
	) {
		viewport.scrollLeft = center.x * viewport.scrollWidth - viewport.clientWidth / 2;
		viewport.scrollTop = center.y * viewport.scrollHeight - viewport.clientHeight / 2;
	}

	function updatePosterZoom(nextZoom: number) {
		const targetZoom = Math.min(POSTER_ZOOM_MAX, Math.max(POSTER_ZOOM_MIN, nextZoom));
		if (targetZoom === posterTargetZoom && posterZoom === targetZoom) return;

		const viewport = posterViewport;
		const center = viewport ? getPosterViewportCenter(viewport) : null;
		const startZoom = posterZoom;

		cancelPosterZoomAnimation();
		const updateVersion = posterAnimationVersion;
		posterTargetZoom = targetZoom;

		if (!viewport || !center) {
			posterZoom = targetZoom;
			return;
		}

		const activeViewport = viewport;
		const focalCenter = center;

		if (
			targetZoom === startZoom ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			posterZoom = targetZoom;
			void tick().then(() => {
				if (updateVersion === posterAnimationVersion && activeViewport.isConnected) {
					restorePosterViewportCenter(activeViewport, focalCenter);
				}
			});

			return;
		}

		posterZoomAnimating = true;
		const startTime = performance.now();

		function animateZoom(currentTime: number) {
			if (updateVersion !== posterAnimationVersion) return;

			const progress = Math.min((currentTime - startTime) / POSTER_ZOOM_DURATION, 1);
			const easedProgress = 1 - Math.pow(1 - progress, 3);
			posterZoom = startZoom + (targetZoom - startZoom) * easedProgress;

			void tick().then(() => {
				if (updateVersion !== posterAnimationVersion) return;

				if (!activeViewport.isConnected) {
					posterZoom = targetZoom;
					posterZoomAnimating = false;
					posterAnimationFrame = null;
					return;
				}

				restorePosterViewportCenter(activeViewport, focalCenter);

				if (progress < 1) {
					posterAnimationFrame = requestAnimationFrame(animateZoom);
				} else {
					posterZoom = targetZoom;
					posterZoomAnimating = false;
					posterAnimationFrame = null;
				}
			});
		}

		posterAnimationFrame = requestAnimationFrame(animateZoom);
	}

	function resetPosterZoomForOpen() {
		cancelPosterZoomAnimation();
		posterZoom = POSTER_ZOOM_MIN;
		posterTargetZoom = POSTER_ZOOM_MIN;
	}

	function handlePosterKeydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		if (event.key === '+' || event.key === '=') {
			event.preventDefault();
			updatePosterZoom(posterTargetZoom + POSTER_ZOOM_STEP);
		} else if (event.key === '-') {
			event.preventDefault();
			updatePosterZoom(posterTargetZoom - POSTER_ZOOM_STEP);
		} else if (event.key === '0') {
			event.preventDefault();
			updatePosterZoom(POSTER_ZOOM_MIN);
		}
	}

	onDestroy(cancelPosterZoomAnimation);
</script>

<svelte:head>
	<title>Publications - Yunho Cho</title>
	<meta
		name="description"
		content="Selected publications by Yunho Cho in robotics, teleoperation, and wearable sensing."
	/>
</svelte:head>

<main class="min-h-screen bg-background">
	<article class="mx-auto max-w-[840px] px-5 py-16 sm:px-6 sm:py-24">
		<header class="mb-12 text-center sm:mb-16">
			<h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Publications</h1>
		</header>

		<div class="space-y-6">
			<section
				class="rounded-xl bg-card p-6 sm:p-8"
				aria-labelledby="sew-mimic-title"
			>
				<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
					<span>arXiv preprint (2026)</span>
				</div>

				<h2
					id="sew-mimic-title"
					class="mt-4 text-2xl leading-tight font-semibold tracking-tight text-card-foreground sm:text-3xl"
				>
					A Closed-Form Geometric Retargeting Solver for Upper Body Humanoid Robot
					Teleoperation
				</h2>

				<p class="mt-4 text-sm leading-6 text-muted-foreground">
					Chuizheng Kong, <span class="font-semibold text-foreground">Yunho Cho</span>, Wonsuhk
					Jung, Idris Wibowo*, Parth Shinde*, Sundhar Vinodh-Sangeetha*, Long Kiu Chung,
					Zhenyang Chen, Andrew Mattei, Advaith Nidumukkala, Alexander Elias, Danfei Xu,
					Taylor Higgins, and Shreyas Kousik
				</p>

				<p class="mt-2 text-xs text-muted-foreground">* Equal contribution</p>

				<div class="mt-3 flex flex-wrap justify-end gap-3">
					<a
						href="https://arxiv.org/abs/2602.01632"
						target="_blank"
						rel="noreferrer"
						class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Read paper
					</a>
					<a
						href="https://sew-mimic.com"
						target="_blank"
						rel="noreferrer"
						class="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
					>
						Project page
					</a>
				</div>
			</section>

			<section
				class="rounded-xl bg-card p-6 sm:p-8"
				aria-labelledby="biopatch-title"
			>
				<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
					<span>Biosensors 2023 (Poster)</span>
				</div>

				<h2
					id="biopatch-title"
					class="mt-4 text-2xl leading-tight font-semibold tracking-tight text-card-foreground sm:text-3xl"
				>
					Geometry Optimization of a Piezoresistive Thin Film Biopatch in a Wireless,
					Battery-Operated, Wearable Sensor with On-Device Machine Learning for Early Detection
					of Hypertrophic Scars
				</h2>

				<p class="mt-4 text-sm leading-6 text-muted-foreground">
					<span class="font-semibold text-foreground">Yunho Cho*</span>, Hojin Seo*, Giuliane
					Paschoal, Xiaoqing Yu, and Tequila A. L. Harris
				</p>

				<p class="mt-2 text-xs text-muted-foreground">* Equal contribution</p>

				<div class="mt-3 flex flex-wrap justify-end gap-3">
					<Dialog.Root>
						<Dialog.Trigger
							onclick={resetPosterZoomForOpen}
							class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							View poster
						</Dialog.Trigger>
						<Dialog.Content
							onkeydown={handlePosterKeydown}
							class="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-6xl"
						>
							<Dialog.Title class="sr-only">Biosensors 2023 poster</Dialog.Title>
							<Dialog.Description class="sr-only">
								Poster for the piezoresistive thin-film biopatch project. Use the zoom controls
								to inspect the poster in more detail.
							</Dialog.Description>

							<div class="flex items-center justify-between gap-3 border-b px-3 py-2 pr-12">
								<span class="hidden text-xs font-medium text-muted-foreground sm:inline">
									Poster preview
								</span>
								<div
									class="flex items-center gap-1"
									role="group"
									aria-label="Poster zoom controls"
								>
									<Button
										variant="outline"
										size="icon"
										class="size-8"
										disabled={posterTargetZoom === POSTER_ZOOM_MIN}
										onclick={() => updatePosterZoom(posterTargetZoom - POSTER_ZOOM_STEP)}
										aria-label="Zoom out"
										title="Zoom out (−)"
									>
										<MinusIcon />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="min-w-16 px-2 text-xs tabular-nums"
										onclick={() => updatePosterZoom(POSTER_ZOOM_MIN)}
										aria-label="Reset poster zoom to fit"
										title="Reset to fit (0)"
									>
										{Math.round(posterZoom)}%
									</Button>
									<Button
										variant="outline"
										size="icon"
										class="size-8"
										disabled={posterTargetZoom === POSTER_ZOOM_MAX}
										onclick={() => updatePosterZoom(posterTargetZoom + POSTER_ZOOM_STEP)}
										aria-label="Zoom in"
										title="Zoom in (+)"
									>
										<PlusIcon />
									</Button>
								</div>
							</div>

							<div
								bind:this={posterViewport}
								class="min-h-0 overflow-auto overscroll-contain bg-muted/30 p-3"
								data-testid="poster-viewport"
								data-zooming={posterZoomAnimating}
							>
								<div
									class="mx-auto w-fit origin-top"
									style:zoom={posterZoom / 100}
									data-testid="poster-canvas"
								>
									<img
										src="https://assets.yunhocho.com/images/Biosensors%202023%20Poster.jpg"
										alt="Biosensors 2023 poster for the piezoresistive thin-film biopatch project"
										class="block h-auto max-h-[calc(100dvh-7rem)] w-auto max-w-[calc(100vw-3.5rem)] rounded-md"
									/>
								</div>
							</div>
						</Dialog.Content>
					</Dialog.Root>
				</div>
			</section>
		</div>
	</article>
</main>

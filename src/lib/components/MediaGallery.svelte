<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- gallery fallbacks are validated absolute HTTPS URLs */
	import { onMount, tick } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import GlobeIcon from '@lucide/svelte/icons/globe-2';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import * as Carousel from '$lib/components/ui/carousel';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import {
		registerGalleryAutoplay,
		type GalleryAutoplayRegistration
	} from '$lib/gallery-autoplay';
	import type { ProjectGallery } from '$lib/project-gallery';

	const IMAGE_DURATION_MS = 5_000;
	const IFRAME_DURATION_MS = 15_000;
	const DEFAULT_ASPECT_RATIO = 16 / 9;
	const MIN_INTERSECTION_RATIO = 0.35;

	export let gallery: ProjectGallery;

	let root: HTMLElement;
	let api: CarouselAPI | undefined;
	let selectedIndex = 0;
	let intersectionRatio = 0;
	let centerDistance = Number.POSITIVE_INFINITY;
	let documentVisible = true;
	let explicitPaused = false;
	let reducedMotion = false;
	let coordinatorActive = false;
	let userVideoBlocked = false;
	let playbackFeedback: 'paused' | 'playing' | undefined;
	let playbackFeedbackId = 0;
	let playbackAnnouncement = '';
	let registration: GalleryAutoplayRegistration | undefined;
	let timerId: number | undefined;
	let feedbackTimerId: number | undefined;
	let timerStartedAt = 0;
	let remainingMs = IMAGE_DURATION_MS;
	let videoPlayPending = false;
	let slideRatios: number[] = gallery.items.map(() => DEFAULT_ASPECT_RATIO);
	let mediaErrors: boolean[] = gallery.items.map(() => false);
	const videoElements = new SvelteMap<number, HTMLVideoElement>();
	const programmaticVideoPauses = new SvelteSet<number>();
	const thumbnailElements = new SvelteMap<number, HTMLButtonElement>();

	$: activeItem = gallery.items[selectedIndex] ?? gallery.items[0];
	$: stageRatio = slideRatios[selectedIndex] ?? DEFAULT_ASPECT_RATIO;

	function getSlideDuration(index = selectedIndex): number {
		return gallery.items[index]?.kind === 'iframe' ? IFRAME_DURATION_MS : IMAGE_DURATION_MS;
	}

	function isLocallyEligible(): boolean {
		return (
			gallery.items.length > 1 &&
			!explicitPaused &&
			!userVideoBlocked &&
			intersectionRatio >= MIN_INTERSECTION_RATIO &&
			documentVisible
		);
	}

	function showPlaybackFeedback(state: 'paused' | 'playing'): void {
		if (feedbackTimerId !== undefined) {
			window.clearTimeout(feedbackTimerId);
			feedbackTimerId = undefined;
		}

		playbackFeedback = state;
		playbackFeedbackId += 1;
		playbackAnnouncement =
			state === 'paused' ? 'Gallery autoplay paused' : 'Gallery autoplay resumed';
		if (state === 'paused') return;

		feedbackTimerId = window.setTimeout(
			() => {
				playbackFeedback = undefined;
				feedbackTimerId = undefined;
			},
			reducedMotion ? 250 : 520
		);
	}

	function clearUserVideoPause(): void {
		const wasUserPaused = userVideoBlocked;
		userVideoBlocked = false;
		if (wasUserPaused && !explicitPaused && playbackFeedback === 'paused') {
			playbackFeedback = undefined;
			playbackAnnouncement = 'Gallery autoplay resumed';
		}
	}

	function toggleGalleryPlayback(): void {
		if (gallery.items.length <= 1) return;

		const shouldPause = !(explicitPaused || userVideoBlocked);
		explicitPaused = shouldPause;
		userVideoBlocked = false;
		showPlaybackFeedback(shouldPause ? 'paused' : 'playing');
		refreshEligibility();
		if (shouldPause) registration?.release();
		else registration?.claim();
	}

	function updateCenterDistance(): void {
		if (!root) return;
		const rect = root.getBoundingClientRect();
		centerDistance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
	}

	function refreshEligibility(): void {
		updateCenterDistance();
		registration?.update({ available: isLocallyEligible(), centerDistance });
		applyPlaybackState();
	}

	function clearTimer(preserveRemaining = true): void {
		if (timerId === undefined) return;
		window.clearTimeout(timerId);
		timerId = undefined;

		if (preserveRemaining) {
			remainingMs = Math.max(0, remainingMs - (performance.now() - timerStartedAt));
		}
	}

	function startTimer(): void {
		if (timerId !== undefined || activeItem?.kind === 'video') return;
		if (remainingMs <= 0) remainingMs = getSlideDuration();
		timerStartedAt = performance.now();
		timerId = window.setTimeout(() => {
			timerId = undefined;
			remainingMs = getSlideDuration();
			advance();
		}, remainingMs);
	}

	function pauseVideo(index: number, reset = false): void {
		const video = videoElements.get(index);
		if (!video) return;

		programmaticVideoPauses.add(index);
		if (!video.paused) video.pause();
		if (reset) {
			try {
				video.currentTime = 0;
			} catch {
				// Some remote media cannot seek until metadata has loaded.
			}
		}
		queueMicrotask(() => programmaticVideoPauses.delete(index));
	}

	function pauseActiveVideo(): void {
		pauseVideo(selectedIndex);
	}

	async function playActiveVideo(): Promise<void> {
		const video = videoElements.get(selectedIndex);
		if (!video || videoPlayPending || !video.paused) return;

		video.muted = true;
		videoPlayPending = true;
		try {
			await video.play();
		} catch {
			if (coordinatorActive && isLocallyEligible()) {
				userVideoBlocked = true;
				refreshEligibility();
			}
		} finally {
			videoPlayPending = false;
		}
	}

	function applyPlaybackState(): void {
		if (!activeItem) return;

		if (!coordinatorActive || !isLocallyEligible()) {
			clearTimer(true);
			pauseActiveVideo();
			return;
		}

		if (activeItem.kind === 'video') {
			clearTimer(false);
			void playActiveVideo();
		} else {
			startTimer();
		}
	}

	function setApi(nextApi: CarouselAPI | undefined): void {
		api?.off('select', handleSelection);
		api = nextApi;
		if (!api) return;
		selectedIndex = api.selectedScrollSnap();
		api.on('select', handleSelection);
	}

	function resetOutgoingVideo(index: number): void {
		pauseVideo(index, true);
	}

	function handleSelection(): void {
		if (!api) return;
		const nextIndex = api.selectedScrollSnap();
		if (nextIndex === selectedIndex) return;

		const previousIndex = selectedIndex;
		clearTimer(false);
		resetOutgoingVideo(previousIndex);
		selectedIndex = nextIndex;
		remainingMs = getSlideDuration(nextIndex);
		clearUserVideoPause();
		void tick().then(() => {
			thumbnailElements.get(nextIndex)?.scrollIntoView({
				behavior: reducedMotion ? 'auto' : 'smooth',
				block: 'nearest',
				inline: 'center'
			});
			refreshEligibility();
		});
	}

	function navigateTo(index: number): void {
		if (index === selectedIndex) {
			remainingMs = getSlideDuration(index);
			refreshEligibility();
			return;
		}

		clearTimer(false);
		clearUserVideoPause();
		remainingMs = getSlideDuration(index);
		api?.scrollTo(index);
	}

	function advance(): void {
		if (gallery.items.length <= 1) return;
		navigateTo((selectedIndex + 1) % gallery.items.length);
	}

	function previous(): void {
		navigateTo((selectedIndex - 1 + gallery.items.length) % gallery.items.length);
	}

	function handleGalleryKeyDown(event: KeyboardEvent): void {
		if (
			gallery.items.length <= 1 ||
			event.defaultPrevented ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey
		)
			return;

		const target = event.target;
		if (
			target instanceof HTMLVideoElement ||
			target instanceof HTMLIFrameElement ||
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			(target instanceof HTMLElement && target.isContentEditable)
		)
			return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			previous();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			advance();
		} else if (event.key === ' ') {
			event.preventDefault();
			toggleGalleryPlayback();
		}
	}

	function handleGalleryClick(event: MouseEvent): void {
		if (event.defaultPrevented || !(event.target instanceof Element)) return;
		if (!event.target.closest('.project-gallery__stage')) return;
		if (event.target.closest('button, a, video, iframe')) return;
		toggleGalleryPlayback();
	}

	function focusGalleryFromPointer(event: PointerEvent): void {
		if (!(event.target instanceof Element)) return;
		if (event.target.closest('button, a, video, iframe')) return;
		root.focus({ preventScroll: true });
	}

	function registerVideo(node: HTMLVideoElement, index: number) {
		videoElements.set(index, node);
		if (index === selectedIndex) applyPlaybackState();

		return {
			destroy() {
				videoElements.delete(index);
			}
		};
	}

	function registerThumbnail(node: HTMLButtonElement, index: number) {
		thumbnailElements.set(index, node);
		return {
			destroy() {
				thumbnailElements.delete(index);
			}
		};
	}

	function updateImageRatio(event: Event, index: number): void {
		const image = event.currentTarget as HTMLImageElement;
		if (image.naturalWidth > 0 && image.naturalHeight > 0) {
			slideRatios[index] = image.naturalWidth / image.naturalHeight;
			slideRatios = [...slideRatios];
		}
	}

	function updateVideoRatio(event: Event, index: number): void {
		const video = event.currentTarget as HTMLVideoElement;
		if (video.videoWidth > 0 && video.videoHeight > 0) {
			slideRatios[index] = video.videoWidth / video.videoHeight;
			slideRatios = [...slideRatios];
		}
	}

	function handleVideoEnded(index: number): void {
		if (index === selectedIndex && coordinatorActive && isLocallyEligible()) advance();
	}

	function handleVideoPause(index: number): void {
		const video = videoElements.get(index);
		if (
			programmaticVideoPauses.has(index) ||
			index !== selectedIndex ||
			!coordinatorActive ||
			!isLocallyEligible() ||
			video?.ended
		)
			return;
		userVideoBlocked = true;
		showPlaybackFeedback('paused');
		refreshEligibility();
	}

	function handleVideoPlay(index: number): void {
		if (index !== selectedIndex || (!userVideoBlocked && !explicitPaused)) return;
		explicitPaused = false;
		userVideoBlocked = false;
		showPlaybackFeedback('playing');
		refreshEligibility();
	}

	function handleMediaError(index: number): void {
		mediaErrors[index] = true;
		mediaErrors = [...mediaErrors];
		if (index === selectedIndex && gallery.items[index]?.kind === 'video') {
			userVideoBlocked = true;
			refreshEligibility();
		}
	}

	onMount(() => {
		documentVisible = document.visibilityState === 'visible';
		const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = reducedMotionQuery.matches;
		explicitPaused = reducedMotion;

		registration = registerGalleryAutoplay((active) => {
			coordinatorActive = active;
			applyPlaybackState();
		});

		const observer = new IntersectionObserver(
			([entry]) => {
				intersectionRatio = entry?.intersectionRatio ?? 0;
				refreshEligibility();
			},
			{ threshold: [0, MIN_INTERSECTION_RATIO, 0.5, 0.75, 1] }
		);
		observer.observe(root);

		const handleVisibilityChange = () => {
			documentVisible = document.visibilityState === 'visible';
			refreshEligibility();
		};
		const handleReducedMotionChange = (event: MediaQueryListEvent) => {
			reducedMotion = event.matches;
			if (event.matches) explicitPaused = true;
			refreshEligibility();
		};
		const handleScroll = () => refreshEligibility();

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleScroll);
		reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
		refreshEligibility();

		return () => {
			clearTimer(false);
			if (feedbackTimerId !== undefined) window.clearTimeout(feedbackTimerId);
			pauseActiveVideo();
			api?.off('select', handleSelection);
			observer.disconnect();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleScroll);
			reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
			registration?.unregister();
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions (the labelled gallery region is intentionally keyboard-focusable) -->
<section
	bind:this={root}
	class="project-gallery not-prose"
	aria-label={gallery.title || 'Project media gallery'}
	aria-keyshortcuts={gallery.items.length > 1 ? 'ArrowLeft ArrowRight Space' : undefined}
	tabindex={gallery.items.length > 1 ? 0 : undefined}
	onkeydown={handleGalleryKeyDown}
	onpointerdown={focusGalleryFromPointer}
	onclick={handleGalleryClick}
>
	<span class="sr-only" aria-live="polite">{playbackAnnouncement}</span>

	{#if gallery.title}
		<h2 class="project-gallery__title">{gallery.title}</h2>
	{/if}

	<div class="project-gallery__stage" style:aspect-ratio={stageRatio}>
		{#if gallery.items.length === 1}
			<div class="project-gallery__slide">
				{#if activeItem.kind === 'image'}
					<img
						src={activeItem.src}
						alt={activeItem.label}
						loading="lazy"
						decoding="async"
						onload={(event) => updateImageRatio(event, 0)}
						onerror={() => handleMediaError(0)}
					/>
				{:else if activeItem.kind === 'video'}
					<video
						use:registerVideo={0}
						src={activeItem.src}
						controls
						muted
						playsinline
						preload="metadata"
						aria-label={activeItem.label}
						onloadedmetadata={(event) => updateVideoRatio(event, 0)}
						onerror={() => handleMediaError(0)}
					></video>
				{:else}
					<iframe
						src={activeItem.src}
						title={activeItem.label}
						loading="lazy"
						sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
						allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; gamepad; gyroscope; picture-in-picture; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
					></iframe>
				{/if}
				{#if mediaErrors[0]}
					<a class="project-gallery__fallback" href={activeItem.src} target="_blank" rel="noopener noreferrer">Open media</a>
				{/if}
			</div>
		{:else}
			<Carousel.Root
				class="project-gallery__carousel"
				opts={{ loop: true, align: 'start' }}
				{setApi}
			>
				<Carousel.Content class="project-gallery__track">
					{#each gallery.items as item, index (index)}
						<Carousel.Item class="project-gallery__item" aria-label={`${index + 1} of ${gallery.items.length}`}>
							<div class="project-gallery__slide">
								{#if item.kind === 'image'}
									<img
										src={item.src}
										alt={item.label}
										loading={index === 0 ? 'eager' : 'lazy'}
										decoding="async"
										onload={(event) => updateImageRatio(event, index)}
										onerror={() => handleMediaError(index)}
									/>
								{:else if item.kind === 'video'}
									<video
										use:registerVideo={index}
										src={item.src}
										controls
										muted
										playsinline
										preload="metadata"
										aria-label={item.label}
										onloadedmetadata={(event) => updateVideoRatio(event, index)}
										onended={() => handleVideoEnded(index)}
										onpause={() => handleVideoPause(index)}
										onplay={() => handleVideoPlay(index)}
										onerror={() => handleMediaError(index)}
									></video>
								{:else}
									<iframe
										src={item.src}
										title={item.label}
										loading="lazy"
										sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
										allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; gamepad; gyroscope; picture-in-picture; web-share"
										referrerpolicy="strict-origin-when-cross-origin"
									></iframe>
								{/if}
								{#if mediaErrors[index]}
									<a class="project-gallery__fallback" href={item.src} target="_blank" rel="noopener noreferrer">Open media</a>
								{/if}
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		{/if}

		{#if playbackFeedback}
			{#key playbackFeedbackId}
				<span
					class="project-gallery__playback-feedback"
					data-state={playbackFeedback}
					aria-hidden="true"
				>
					{#if playbackFeedback === 'paused'}
						<PauseIcon />
					{:else}
						<PlayIcon />
					{/if}
				</span>
			{/key}
		{/if}
	</div>

	{#if activeItem.caption}
		<p class="project-gallery__caption" aria-live="polite">{activeItem.caption}</p>
	{/if}

	{#if gallery.items.length > 1}
		<div class="project-gallery__thumbnails" aria-label="Choose a gallery slide">
			<div class="project-gallery__thumbnail-list">
				{#each gallery.items as item, index (index)}
					<button
						use:registerThumbnail={index}
						type="button"
						class="project-gallery__thumbnail"
						class:project-gallery__thumbnail--active={index === selectedIndex}
						aria-label={`Show slide ${index + 1}: ${item.label}`}
						aria-current={index === selectedIndex ? 'true' : undefined}
						onclick={() => navigateTo(index)}
					>
						{#if item.kind === 'image'}
							<img src={item.src} alt="" loading="lazy" aria-hidden="true" />
						{:else if item.kind === 'video'}
							<video src={item.src} muted playsinline preload="metadata" aria-hidden="true"></video>
						{:else}
							<span class="project-gallery__embed-thumbnail">
								<GlobeIcon />
								<span>{item.host}</span>
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.project-gallery {
		width: min(62rem, calc(100vw - 2rem));
		margin: 3rem 50%;
		transform: translateX(-50%);
	}

	.project-gallery:focus-visible {
		outline: none;
	}

	.project-gallery:focus-visible .project-gallery__stage {
		border-color: var(--ring);
		box-shadow:
			0 0 0 3px color-mix(in oklab, var(--ring) 24%, transparent),
			0 16px 42px rgb(0 0 0 / 0.09),
			0 2px 8px rgb(0 0 0 / 0.05);
	}

	.project-gallery__title {
		margin: 0 0 0.75rem;
		color: var(--foreground);
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.project-gallery__stage {
		position: relative;
		width: 100%;
		max-height: 75svh;
		min-height: 12rem;
		overflow: hidden;
		border: 1px solid color-mix(in oklab, var(--border) 72%, var(--foreground) 28%);
		border-radius: 0.875rem;
		background: var(--muted);
		box-shadow:
			0 16px 42px rgb(0 0 0 / 0.09),
			0 2px 8px rgb(0 0 0 / 0.05);
		transition: aspect-ratio 240ms ease;
	}

	.project-gallery__playback-feedback {
		position: absolute;
		z-index: 4;
		inset: 50% auto auto 50%;
		display: grid;
		width: 4.25rem;
		height: 4.25rem;
		place-items: center;
		border: 1px solid rgb(255 255 255 / 0.2);
		border-radius: 9999px;
		background: rgb(12 12 14 / 0.48);
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.18);
		color: white;
		pointer-events: none;
		transform: translate(-50%, -50%);
		-webkit-backdrop-filter: blur(7px);
		backdrop-filter: blur(7px);
	}

	.project-gallery__playback-feedback[data-state='paused'] {
		animation: gallery-playback-pause-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.project-gallery__playback-feedback[data-state='playing'] {
		animation: gallery-playback-resume 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.project-gallery__playback-feedback :global(svg) {
		width: 1.55rem;
		height: 1.55rem;
		fill: currentColor;
		stroke-width: 2.35;
	}

	@keyframes gallery-playback-pause-in {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1.14);
		}

		100% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	@keyframes gallery-playback-resume {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1.14);
		}

		18% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}

		68% {
			opacity: 0.92;
			transform: translate(-50%, -50%) scale(0.9);
		}

		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.76);
		}
	}

	:global(.project-gallery__carousel),
	:global(.project-gallery__carousel [data-slot='carousel-content']),
	:global(.project-gallery__carousel [data-embla-container]),
	:global(.project-gallery__carousel [data-embla-slide]) {
		height: 100%;
	}

	:global(.project-gallery__track) {
		margin-inline-start: 0;
	}

	:global(.project-gallery__item) {
		padding-inline-start: 0;
	}

	.project-gallery__slide {
		position: relative;
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
		overflow: hidden;
	}

	.project-gallery__slide > :is(img, video, iframe) {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
		object-fit: contain;
	}

	.project-gallery__slide > iframe {
		background: var(--background);
	}

	.project-gallery__fallback {
		position: absolute;
		inset: 50% auto auto 50%;
		border-radius: 0.5rem;
		padding: 0.55rem 0.8rem;
		background: var(--background);
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
		color: var(--foreground);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transform: translate(-50%, -50%);
	}

	.project-gallery__caption {
		margin: 0.7rem 0 0;
		color: var(--muted-foreground);
		font-size: 0.8125rem;
		line-height: 1.45;
		text-align: center;
	}

	.project-gallery__thumbnails {
		margin-top: 0.7rem;
		overflow-x: auto;
		scrollbar-width: thin;
		scroll-snap-type: x proximity;
	}

	.project-gallery__thumbnail-list {
		display: flex;
		box-sizing: border-box;
		width: max-content;
		min-width: 100%;
		justify-content: center;
		gap: 0.55rem;
		padding: 0.2rem 0.25rem 0.45rem;
	}

	.project-gallery__thumbnail {
		position: relative;
		display: block;
		width: 5rem;
		height: 3.25rem;
		flex: 0 0 auto;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 0.55rem;
		padding: 0;
		background: var(--muted);
		color: var(--muted-foreground);
		cursor: pointer;
		opacity: 0.72;
		scroll-snap-align: center;
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease,
			opacity 150ms ease;
	}

	.project-gallery__thumbnail:hover,
	.project-gallery__thumbnail--active {
		opacity: 1;
	}

	.project-gallery__thumbnail--active {
		border-color: var(--foreground);
		box-shadow: 0 0 0 2px var(--background), 0 0 0 3px var(--foreground);
	}

	.project-gallery__thumbnail:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.project-gallery__thumbnail > :is(img, video) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.project-gallery__embed-thumbnail {
		display: flex;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.35rem;
		background: var(--background);
	}

	.project-gallery__embed-thumbnail :global(svg) {
		width: 0.85rem;
		height: 0.85rem;
		flex: 0 0 auto;
	}

	.project-gallery__embed-thumbnail span {
		overflow: hidden;
		font-size: 0.625rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 40rem) {
		.project-gallery {
			width: calc(100vw - 1.25rem);
		}

		.project-gallery__stage {
			min-height: 10rem;
			border-radius: 0.7rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.project-gallery__stage,
		.project-gallery__thumbnail {
			transition: none;
		}

		.project-gallery__playback-feedback[data-state] {
			animation: none;
		}
	}
</style>

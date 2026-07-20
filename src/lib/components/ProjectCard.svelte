<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { Project } from '$lib/notion';

	export let project: Project;

	const HOVER_INTENT_DELAY_MS = 300;
	const VIDEO_EXTENSION = /\.(?:m4v|mov|mp4|ogg|ogv|webm)$/i;

	let cardElement: HTMLAnchorElement;
	let activeIndex = 0;
	let pointerInside = false;
	let scrubActive = false;
	let scrubSupported = false;
	let prefersReducedMotion = false;
	let mediaPreferencesReady = false;
	let galleryPrepared = false;
	let lastPointerX = 0;
	let mediaContainerAspectRatio = 0;
	let galleryMediaAspectRatios: Array<number | undefined> = [];
	let hoverIntentTimer: ReturnType<typeof setTimeout> | undefined;
	const galleryVideoElements = new Map<number, HTMLVideoElement>();

	$: galleryItems = project.thumbnailGallery ?? [];
	$: galleryMediaContainStates = galleryItems.map((_, index) => {
		const mediaAspectRatio = galleryMediaAspectRatios[index];
		return Boolean(
			mediaAspectRatio &&
				mediaContainerAspectRatio &&
				mediaAspectRatio > mediaContainerAspectRatio
		);
	});
	$: activeGalleryItem = galleryItems[activeIndex] ?? galleryItems[0];
	$: activeSource = activeGalleryItem?.src ?? project.thumbnail;
	$: activeKind = activeGalleryItem?.kind ?? (VIDEO_EXTENSION.test(activeSource) ? 'video' : 'image');
	$: {
		activeIndex;
		mediaPreferencesReady;
		prefersReducedMotion;
		galleryPrepared;
		updateGalleryVideoPlayback();
	}

	onMount(() => {
		const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

		function updateInteractionSupport() {
			prefersReducedMotion = reducedMotion.matches;
			mediaPreferencesReady = true;
			scrubSupported = finePointer.matches && !prefersReducedMotion;
			if (!scrubSupported) resetScrub();
			if (prefersReducedMotion) cardElement.querySelector('video')?.pause();
		}

		updateInteractionSupport();
		finePointer.addEventListener('change', updateInteractionSupport);
		reducedMotion.addEventListener('change', updateInteractionSupport);

		return () => {
			finePointer.removeEventListener('change', updateInteractionSupport);
			reducedMotion.removeEventListener('change', updateInteractionSupport);
			if (hoverIntentTimer) clearTimeout(hoverIntentTimer);
		};
	});

	function selectItemAt(pointerX: number) {
		if (galleryItems.length < 2) return;

		const bounds = cardElement.getBoundingClientRect();
		if (bounds.width <= 0) return;

		const relativeX = Math.min(Math.max(pointerX - bounds.left, 0), bounds.width - 1);
		activeIndex = Math.min(
			Math.floor((relativeX / bounds.width) * galleryItems.length),
			galleryItems.length - 1
		);
	}

	function handlePointerEnter(event: PointerEvent) {
		if (!scrubSupported || galleryItems.length < 2 || event.pointerType === 'touch') return;

		pointerInside = true;
		galleryPrepared = true;
		lastPointerX = event.clientX;
		if (hoverIntentTimer) clearTimeout(hoverIntentTimer);
		hoverIntentTimer = setTimeout(() => {
			if (!pointerInside) return;
			scrubActive = true;
			selectItemAt(lastPointerX);
		}, HOVER_INTENT_DELAY_MS);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!pointerInside || event.pointerType === 'touch') return;

		lastPointerX = event.clientX;
		if (scrubActive) selectItemAt(lastPointerX);
	}

	function handlePointerLeave() {
		resetScrub();
	}

	function resetScrub() {
		pointerInside = false;
		scrubActive = false;
		activeIndex = 0;
		if (hoverIntentTimer) {
			clearTimeout(hoverIntentTimer);
			hoverIntentTimer = undefined;
		}
	}

	function registerGalleryVideo(node: HTMLVideoElement, index: number) {
		function recordAspectRatio() {
			recordGalleryMediaAspectRatio(index, node.videoWidth, node.videoHeight);
		}

		galleryVideoElements.set(index, node);
		node.addEventListener('loadedmetadata', recordAspectRatio);
		recordAspectRatio();
		updateGalleryVideoPlayback();

		return {
			destroy() {
				galleryVideoElements.delete(index);
				node.removeEventListener('loadedmetadata', recordAspectRatio);
			}
		};
	}

	function measureGalleryImage(node: HTMLImageElement, index: number) {
		function recordAspectRatio() {
			recordGalleryMediaAspectRatio(index, node.naturalWidth, node.naturalHeight);
		}

		node.addEventListener('load', recordAspectRatio);
		recordAspectRatio();

		return {
			destroy() {
				node.removeEventListener('load', recordAspectRatio);
			}
		};
	}

	function observeMediaContainer(node: HTMLElement) {
		function updateAspectRatio() {
			const { width, height } = node.getBoundingClientRect();
			mediaContainerAspectRatio = width > 0 && height > 0 ? width / height : 0;
		}

		const observer = new ResizeObserver(updateAspectRatio);
		updateAspectRatio();
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function recordGalleryMediaAspectRatio(index: number, width: number, height: number) {
		if (width <= 0 || height <= 0) return;

		const aspectRatio = width / height;
		if (galleryMediaAspectRatios[index] === aspectRatio) return;

		const nextAspectRatios = [...galleryMediaAspectRatios];
		nextAspectRatios[index] = aspectRatio;
		galleryMediaAspectRatios = nextAspectRatios;
	}

	function updateGalleryVideoPlayback() {
		for (const [index, video] of galleryVideoElements) {
			const shouldPlay = index === activeIndex && mediaPreferencesReady && !prefersReducedMotion;
			if (shouldPlay && video.paused) {
				void video.play().catch(() => undefined);
			} else if (!shouldPlay && !video.paused) {
				video.pause();
			}
		}
	}
</script>

<a
	bind:this={cardElement}
	href="/projects/{project.slug}"
	class="group relative block overflow-hidden rounded-lg border border-border transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-xl focus-visible:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
	data-gallery-scrub={galleryItems.length > 1 ? 'available' : undefined}
	data-gallery-scrub-active={scrubActive ? 'true' : undefined}
	data-active-gallery-index={galleryItems.length > 0 ? activeIndex : undefined}
	onpointerenter={handlePointerEnter}
	onpointermove={handlePointerMove}
	onpointerleave={handlePointerLeave}
>
	<div
		use:observeMediaContainer
		class="project-card-media h-48 w-full overflow-hidden"
		class:project-card-media--gallery={galleryItems.length > 0}
		class:project-card-media--single={galleryItems.length === 0}
	>
		{#if galleryItems.length > 0}
			{#each galleryItems as item, index (`${item.kind}:${item.src}:${index}`)}
				{#if index === 0 || galleryPrepared}
					<div
						class="project-card-media-layer"
						class:project-card-media-layer--active={index === activeIndex}
						class:project-card-media-layer--contain={galleryMediaContainStates[index]}
						data-card-media-active={index === activeIndex ? 'true' : undefined}
						data-card-media-fit={galleryMediaContainStates[index] ? 'contain' : 'cover'}
						aria-hidden={index === activeIndex ? undefined : 'true'}
					>
						{#if item.kind === 'video'}
							<video
								use:registerGalleryVideo={index}
								src={item.src}
								loop
								muted
								playsinline
								preload="metadata"
								disablepictureinpicture
								aria-label={index === activeIndex ? item.label : undefined}
							></video>
						{:else}
							<img
								use:measureGalleryImage={index}
								src={item.src}
								alt={index === activeIndex ? item.label : ''}
							/>
						{/if}
					</div>
				{/if}
			{/each}
		{:else if activeKind === 'video'}
			<video
				src={activeSource}
				autoplay={mediaPreferencesReady && !prefersReducedMotion}
				loop
				muted
				playsinline
				preload="metadata"
				disablepictureinpicture
				aria-label={activeGalleryItem?.label ?? project.name}
				class="pointer-events-none h-full w-full object-cover"
			></video>
		{:else}
			<img
				src={activeSource}
				alt={activeGalleryItem?.label ?? project.name}
				class="pointer-events-none h-full w-full object-cover"
			/>
		{/if}
	</div>
	<div
		class="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
	></div>
	<div class="absolute inset-0 flex flex-col p-4 text-white">
		<div>
			<h3 class="font-semibold text-white drop-shadow-[0_0_9px_rgba(0,0,0,0.9)]">{project.name}</h3>
			{#if project.description}
				<p
					class="project-card-description mt-2 line-clamp-3 -translate-y-1 text-sm leading-snug text-white/90 opacity-0 drop-shadow-sm transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
				>
					{project.description}
				</p>
			{/if}
		</div>

		{#if project.tags.length > 0}
			<div
				class="project-card-tags mt-auto translate-y-2 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
			>
				<div class="flex flex-wrap gap-1.5">
					{#each project.tags as tag}
						<div
							class="flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
						>
							{#if tag.icon}
								<Icon icon={tag.icon} width="13" height="13" />
							{/if}
							<span>{tag.name}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</a>

<style>
	.project-card-media {
		position: relative;
	}

	.project-card-media--gallery {
		background: var(--muted);
	}

	.project-card-media--single {
		transition: transform 500ms;
	}

	.project-card-media--single > :is(img, video) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:global(.group:hover) .project-card-media--single,
	:global(.group:focus-visible) .project-card-media--single {
		transform: scale(1.1);
	}

	.project-card-media-layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1);
		will-change: opacity;
	}

	.project-card-media-layer--active {
		opacity: 1;
	}

	.project-card-media-layer > :is(img, video) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.project-card-media-layer--contain > :is(img, video) {
		object-fit: contain;
	}

	@media (prefers-reduced-motion: reduce) {
		.project-card-media-layer {
			transition: none;
		}
	}
</style>

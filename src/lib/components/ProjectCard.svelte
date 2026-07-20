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
	let lastPointerX = 0;
	let hoverIntentTimer: ReturnType<typeof setTimeout> | undefined;

	$: galleryItems = project.thumbnailGallery ?? [];
	$: activeGalleryItem = galleryItems[activeIndex] ?? galleryItems[0];
	$: activeSource = activeGalleryItem?.src ?? project.thumbnail;
	$: activeKind = activeGalleryItem?.kind ?? (VIDEO_EXTENSION.test(activeSource) ? 'video' : 'image');

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
	{#key `${activeKind}:${activeSource}`}
		{#if activeKind === 'video'}
			<video
				src={activeSource}
				autoplay={mediaPreferencesReady && !prefersReducedMotion}
				loop
				muted
				playsinline
				preload="metadata"
				disablepictureinpicture
				aria-label={activeGalleryItem?.label ?? project.name}
				class="pointer-events-none h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
			></video>
		{:else}
			<img
				src={activeSource}
				alt={activeGalleryItem?.label ?? project.name}
				class="pointer-events-none h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
			/>
		{/if}
	{/key}
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

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HeroGridCell } from '$lib/hero-grid';

	interface Props {
		cells: HeroGridCell[][];
		activationDelay?: number;
		children: Snippet;
	}

	let { cells, activationDelay = 0, children }: Props = $props();

	let heroElement: HTMLElement;
	let enabled = $state(false);
	let activeCell = $state<HeroGridCell | null>(null);
	let layerA = $state<HeroGridCell | null>(null);
	let layerB = $state<HeroGridCell | null>(null);
	let activeLayer = $state<-1 | 0 | 1>(-1);
	let outgoingLayer = $state<-1 | 0 | 1>(-1);
	let incomingLayer = $state<-1 | 0 | 1>(-1);
	let transitionMs = $state(480);
	let gridVisible = $state(false);
	let interactionSupported = $state(false);
	let transitionInProgress = false;
	let queuedCell: HeroGridCell | null = null;

	let candidateId: string | null = null;
	let dwellTimer: ReturnType<typeof setTimeout> | undefined;
	let leaveTimer: ReturnType<typeof setTimeout> | undefined;
	let transitionTimer: ReturnType<typeof setTimeout> | undefined;
	let frameRequest: number | undefined;

	const rowCount = $derived(cells.length);
	const columnCount = $derived(cells[0]?.length ?? 0);
	const cellWidth = $derived(columnCount > 0 ? `${100 / columnCount}%` : '100%');
	const cellHeight = $derived(rowCount > 0 ? `${100 / rowCount}%` : '100%');

	$effect(() => {
		if (!interactionSupported || enabled) return;

		const timer = setTimeout(() => {
			enabled = true;
		}, Math.max(0, activationDelay));

		return () => clearTimeout(timer);
	});

	onMount(() => {
		const supportsInteraction = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!supportsInteraction || prefersReducedMotion) return;
		interactionSupported = true;
		window.addEventListener('keydown', handleGridToggle);

		const uniqueImages = new Set(cells.flat().map(mediaPoster).filter(Boolean));
		for (const source of uniqueImages) {
			const image = new Image();
			image.decoding = 'async';
			image.src = source;
		}

		return () => {
			window.removeEventListener('keydown', handleGridToggle);
			if (dwellTimer) clearTimeout(dwellTimer);
			if (leaveTimer) clearTimeout(leaveTimer);
			if (transitionTimer) clearTimeout(transitionTimer);
			if (frameRequest) cancelAnimationFrame(frameRequest);
		};
	});

	function handleGridToggle(event: KeyboardEvent) {
		if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		) {
			return;
		}

		if (event.key.toLowerCase() === 'v') gridVisible = !gridVisible;
	}

	function handlePointerMove(event: PointerEvent) {
		if (!enabled || event.pointerType === 'touch' || rowCount === 0 || columnCount === 0) return;

		if (leaveTimer) clearTimeout(leaveTimer);

		const bounds = heroElement.getBoundingClientRect();
		const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width - 1);
		const relativeY = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height - 1);
		const column = Math.min(Math.floor((relativeX / bounds.width) * columnCount), columnCount - 1);
		const row = Math.min(Math.floor((relativeY / bounds.height) * rowCount), rowCount - 1);
		const cell = cells[row]?.[column];

		if (!cell) return;
		if (cell.id === activeCell?.id) {
			candidateId = null;
			if (dwellTimer) clearTimeout(dwellTimer);
			if (transitionInProgress) queuedCell = null;
			return;
		}
		if (cell.id === candidateId) return;

		if (dwellTimer) clearTimeout(dwellTimer);
		candidateId = cell.id;
		dwellTimer = setTimeout(() => {
			candidateId = null;
			showCell(cell);
		}, cell.dwellMs);
	}

	function handlePointerLeave() {
		candidateId = null;
		if (dwellTimer) clearTimeout(dwellTimer);

		if (activeCell?.leaveBehavior === 'clear') {
			leaveTimer = setTimeout(() => {
				clearActiveCell();
			}, 180);
		}
	}

	function showCell(cell: HeroGridCell) {
		if (transitionInProgress) {
			queuedCell = cell;
			return;
		}

		const nextLayer = activeLayer === 0 ? 1 : 0;
		const previousLayer = activeLayer;
		transitionInProgress = true;
		transitionMs = cell.transitionMs;
		activeCell = cell;
		if (transitionTimer) clearTimeout(transitionTimer);

		if (nextLayer === 0) layerA = cell;
		else layerB = cell;

		outgoingLayer = previousLayer;
		incomingLayer = nextLayer;

		if (frameRequest) cancelAnimationFrame(frameRequest);
		frameRequest = requestAnimationFrame(() => {
			activeLayer = nextLayer;
			transitionTimer = setTimeout(() => {
				outgoingLayer = -1;
				incomingLayer = -1;
				transitionInProgress = false;

				const nextCell = queuedCell;
				queuedCell = null;
				if (nextCell && nextCell.id !== activeCell?.id) {
					frameRequest = requestAnimationFrame(() => showCell(nextCell));
				}
			}, cell.transitionMs);
		});
	}

	function clearActiveCell() {
		queuedCell = null;
		transitionInProgress = false;
		if (transitionTimer) clearTimeout(transitionTimer);
		if (frameRequest) cancelAnimationFrame(frameRequest);

		outgoingLayer = -1;
		incomingLayer = activeLayer;
		frameRequest = requestAnimationFrame(() => {
			activeLayer = -1;
			activeCell = null;
			transitionTimer = setTimeout(() => {
				incomingLayer = -1;
			}, transitionMs);
		});
	}

	function mediaPoster(cell: HeroGridCell) {
		if (!cell.media) return '';
		return cell.media.kind === 'image' ? cell.media.src : cell.media.poster;
	}

	function backgroundImage(cell: HeroGridCell | null) {
		const source = cell ? mediaPoster(cell) : '';
		return source ? `url(${JSON.stringify(source)})` : 'none';
	}

	function layerVisible(layer: 0 | 1) {
		return activeLayer === layer || incomingLayer === layer || outgoingLayer === layer;
	}
</script>

<section
	class="interactive-hero"
	class:collage-active={activeCell !== null}
	role="presentation"
	bind:this={heroElement}
	onpointermove={handlePointerMove}
	onpointerleave={handlePointerLeave}
>
	<div
		class="hero-visuals"
		aria-hidden="true"
		style:--hero-cell-width={cellWidth}
		style:--hero-cell-height={cellHeight}
		style:--hero-transition={`${transitionMs}ms`}
	>
		<div
			class:active={activeLayer === 0}
			class:outgoing={outgoingLayer === 0}
			class:incoming={incomingLayer === 0}
			class="background-layer"
			style:background-image={backgroundImage(layerA)}
			style:background-color={layerA?.backgroundColor ?? 'transparent'}
			style:background-position={layerA?.position ?? 'center'}
			style:background-size={layerA?.size ?? 'cover'}
			style:--hero-image-opacity={`${layerA?.opacity ?? 0}`}
			style:--hero-image-filter={layerA?.filter ?? 'none'}
			style:--hero-image-scale={`${layerA?.scale ?? 1}`}
			style:mix-blend-mode={layerA?.blendMode ?? 'normal'}
		>
			{#if layerA?.media?.kind === 'video' && layerVisible(0)}
				<video
					class="background-video"
					src={layerA.media.src}
					poster={layerA.media.poster}
					autoplay
					muted
					loop
					playsinline
					preload="metadata"
					disablepictureinpicture
					style:object-position={layerA.position}
					style:object-fit={layerA.size}
				></video>
			{/if}
		</div>
		<div
			class:active={activeLayer === 1}
			class:outgoing={outgoingLayer === 1}
			class:incoming={incomingLayer === 1}
			class="background-layer"
			style:background-image={backgroundImage(layerB)}
			style:background-color={layerB?.backgroundColor ?? 'transparent'}
			style:background-position={layerB?.position ?? 'center'}
			style:background-size={layerB?.size ?? 'cover'}
			style:--hero-image-opacity={`${layerB?.opacity ?? 0}`}
			style:--hero-image-filter={layerB?.filter ?? 'none'}
			style:--hero-image-scale={`${layerB?.scale ?? 1}`}
			style:mix-blend-mode={layerB?.blendMode ?? 'normal'}
		>
			{#if layerB?.media?.kind === 'video' && layerVisible(1)}
				<video
					class="background-video"
					src={layerB.media.src}
					poster={layerB.media.poster}
					autoplay
					muted
					loop
					playsinline
					preload="metadata"
					disablepictureinpicture
					style:object-position={layerB.position}
					style:object-fit={layerB.size}
				></video>
			{/if}
		</div>

		<div class:visible={gridVisible} class="grid-lines"></div>

		{#if activeCell && gridVisible}
			<div
				class="active-cell"
				style:left={`${(activeCell.column / columnCount) * 100}%`}
				style:top={`${(activeCell.row / rowCount) * 100}%`}
				style:width={cellWidth}
				style:height={cellHeight}
			></div>
		{/if}
	</div>

	<div class="hero-content">
		{@render children()}
	</div>
</section>

<style>
	.interactive-hero {
		position: relative;
		isolation: isolate;
		overflow: hidden;
	}

	.hero-visuals {
		position: absolute;
		z-index: 0;
		inset: 0;
		pointer-events: none;
	}

	.background-layer {
		position: absolute;
		inset: -2%;
		opacity: 0;
		filter: var(--hero-image-filter);
		transform: scale(var(--hero-image-scale));
		background-repeat: no-repeat;
		will-change: opacity;
	}

	.background-layer.active,
	.background-layer.outgoing {
		opacity: var(--hero-image-opacity);
	}

	.background-layer.incoming {
		z-index: 1;
		transition: opacity var(--hero-transition) cubic-bezier(0.22, 1, 0.36, 1);
	}

	.background-video {
		display: block;
		width: 100%;
		height: 100%;
	}

	.grid-lines {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 450ms ease;
		background-image:
			linear-gradient(to right, oklch(0.7 0.12 82 / 9%) 1px, transparent 1px),
			linear-gradient(to bottom, oklch(0.7 0.12 82 / 9%) 1px, transparent 1px);
		background-size: var(--hero-cell-width) var(--hero-cell-height);
	}

	.grid-lines.visible {
		opacity: 1;
	}

	.active-cell {
		position: absolute;
		border: 1px solid oklch(0.72 0.14 82 / 25%);
		box-shadow: inset 0 0 1.5rem oklch(0.78 0.14 82 / 5%);
		transition:
			left 180ms ease,
			top 180ms ease;
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
		.hero-visuals {
			display: none;
		}
	}
</style>

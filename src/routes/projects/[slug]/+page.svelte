<script lang="ts">
	import { tick } from 'svelte';
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import { renderProjectMarkdown } from '$lib/project-markdown';

	const TOOLTIP_ID = 'project-hover-tooltip';
	const TOOLTIP_MARGIN = 12;
	const TOOLTIP_GAP = 10;

	export let data: PageData;
	$: ({ project, content } = data);
	$: htmlContent = renderProjectMarkdown(content || '');

	let proseRoot: HTMLDivElement;
	let tooltipElement: HTMLDivElement;
	let activeTrigger: HTMLButtonElement | null = null;
	let hoveredTrigger: HTMLButtonElement | null = null;
	let tooltipContent = '';
	let tooltipOpen = false;
	let tooltipPositioned = false;
	let tooltipPinned = false;
	let tooltipLeft = 0;
	let tooltipTop = 0;
	let tooltipArrowLeft = 0;
	let tooltipPlacement: 'top' | 'bottom' = 'top';

	function getHoverNoteTrigger(target: EventTarget | null): HTMLButtonElement | null {
		if (!(target instanceof Element)) return null;

		const trigger = target.closest<HTMLButtonElement>('[data-project-hover-note]');
		return trigger && proseRoot?.contains(trigger) ? trigger : null;
	}

	function positionTooltip(trigger: HTMLButtonElement) {
		if (!tooltipElement || activeTrigger !== trigger || !tooltipOpen) return;

		const triggerRect = trigger.getBoundingClientRect();
		const tooltipRect = tooltipElement.getBoundingClientRect();
		const centeredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
		const maximumLeft = Math.max(TOOLTIP_MARGIN, window.innerWidth - tooltipRect.width - TOOLTIP_MARGIN);

		tooltipLeft = Math.min(maximumLeft, Math.max(TOOLTIP_MARGIN, centeredLeft));
		tooltipPlacement =
			triggerRect.top - tooltipRect.height - TOOLTIP_GAP >= TOOLTIP_MARGIN ? 'top' : 'bottom';
		tooltipTop =
			tooltipPlacement === 'top'
				? triggerRect.top - tooltipRect.height - TOOLTIP_GAP
				: Math.min(
						window.innerHeight - tooltipRect.height - TOOLTIP_MARGIN,
						triggerRect.bottom + TOOLTIP_GAP
					);
		tooltipTop = Math.max(TOOLTIP_MARGIN, tooltipTop);
		tooltipArrowLeft = Math.min(
			tooltipRect.width - 12,
			Math.max(12, triggerRect.left + triggerRect.width / 2 - tooltipLeft)
		);
		tooltipPositioned = true;
	}

	async function showTooltip(trigger: HTMLButtonElement) {
		const nextContent = trigger.dataset.projectHoverNoteContent?.trim();
		if (!nextContent) return;

		if (activeTrigger && activeTrigger !== trigger) {
			activeTrigger.removeAttribute('aria-describedby');
		}

		activeTrigger = trigger;
		tooltipContent = nextContent;
		tooltipOpen = true;
		tooltipPositioned = false;
		trigger.setAttribute('aria-describedby', TOOLTIP_ID);

		await tick();
		positionTooltip(trigger);
	}

	function hideTooltip() {
		activeTrigger?.removeAttribute('aria-describedby');
		activeTrigger = null;
		tooltipOpen = false;
		tooltipPositioned = false;
		tooltipPinned = false;
	}

	function handlePointerOver(event: PointerEvent) {
		if (event.pointerType === 'touch') return;

		const trigger = getHoverNoteTrigger(event.target);
		if (!trigger || hoveredTrigger === trigger) return;

		hoveredTrigger = trigger;
		void showTooltip(trigger);
	}

	function handlePointerOut(event: PointerEvent) {
		const trigger = getHoverNoteTrigger(event.target);
		if (!trigger) return;
		if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) return;

		if (hoveredTrigger === trigger) hoveredTrigger = null;
		if (!tooltipPinned && document.activeElement !== trigger) hideTooltip();
	}

	function handleFocusIn(event: FocusEvent) {
		const trigger = getHoverNoteTrigger(event.target);
		if (!trigger) return;

		if (activeTrigger !== trigger) tooltipPinned = false;
		void showTooltip(trigger);
	}

	function handleFocusOut(event: FocusEvent) {
		const trigger = getHoverNoteTrigger(event.target);
		if (!trigger || activeTrigger !== trigger) return;
		if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) return;

		if (hoveredTrigger !== trigger) hideTooltip();
	}

	function handleTriggerClick(event: MouseEvent) {
		const trigger = getHoverNoteTrigger(event.target);
		if (!trigger) return;

		if (activeTrigger === trigger && tooltipPinned) {
			hideTooltip();
			return;
		}

		tooltipPinned = true;
		void showTooltip(trigger);
	}

	function handleWindowPointerDown(event: PointerEvent) {
		if (!tooltipOpen || getHoverNoteTrigger(event.target)) return;
		hideTooltip();
	}

	function handleWindowKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && tooltipOpen) hideTooltip();
	}

	function handleViewportChange() {
		if (activeTrigger && tooltipOpen) positionTooltip(activeTrigger);
	}

	function registerHoverNoteEvents(node: HTMLDivElement) {
		proseRoot = node;
		node.addEventListener('pointerover', handlePointerOver);
		node.addEventListener('pointerout', handlePointerOut);
		node.addEventListener('focusin', handleFocusIn);
		node.addEventListener('focusout', handleFocusOut);
		node.addEventListener('click', handleTriggerClick);

		return {
			destroy() {
				node.removeEventListener('pointerover', handlePointerOver);
				node.removeEventListener('pointerout', handlePointerOut);
				node.removeEventListener('focusin', handleFocusIn);
				node.removeEventListener('focusout', handleFocusOut);
				node.removeEventListener('click', handleTriggerClick);
				activeTrigger?.removeAttribute('aria-describedby');
			}
		};
	}
</script>

<svelte:window
	onpointerdown={handleWindowPointerDown}
	onkeydown={handleWindowKeyDown}
	onresize={handleViewportChange}
	onscroll={handleViewportChange}
/>

<svelte:head>
	<title>{project.name} - Yunho Cho</title>
</svelte:head>

<main class="min-h-screen bg-background">
	<article class="mx-auto max-w-[768px] px-5 py-16 sm:px-6 sm:py-24">
		<a href="/projects" class="mb-8 inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
			← Back to Projects
		</a>

		<header class="mb-12">
			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">{project.name}</h1>
			{#if project.tags && project.tags.length > 0}
				<div class="mt-6 flex flex-wrap gap-2">
					{#each project.tags as tag}
						<div class="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground border border-border/50 shadow-sm">
							{#if tag.icon}
								<Icon icon={tag.icon} width="14" height="14" />
							{/if}
							<span>{tag.name}</span>
						</div>
					{/each}
				</div>
			{/if}
		</header>
		
		{#if project.thumbnail}
			{#if project.thumbnail.match(/\.(mp4|webm|ogg|mov)$/i)}
				<video src={project.thumbnail} autoplay loop muted playsinline class="mb-16 w-full rounded-xl object-cover shadow-sm border border-border/50 max-h-[400px]"></video>
			{:else}
				<img src={project.thumbnail} alt={project.name} class="mb-16 w-full rounded-xl object-cover shadow-sm border border-border/50 max-h-[400px]" />
			{/if}
		{/if}

		<!-- Apply Tailwind Typography 'prose' to auto-style the markdown HTML -->
		<div
			use:registerHoverNoteEvents
			class="prose prose-zinc dark:prose-invert max-w-none prose-img:rounded-xl"
		>
			{@html htmlContent}
		</div>
	</article>
</main>

{#if tooltipOpen}
	<div
		bind:this={tooltipElement}
		id={TOOLTIP_ID}
		role="tooltip"
		data-placement={tooltipPlacement}
		class:positioned={tooltipPositioned}
		class="project-hover-tooltip"
		style={`left: ${tooltipLeft}px; top: ${tooltipTop}px; --tooltip-arrow-left: ${tooltipArrowLeft}px;`}
	>
		{tooltipContent}
	</div>
{/if}

<style>
	:global(.project-hover-note) {
		appearance: none;
		margin: 0;
		border: 0;
		border-bottom: 1px dotted color-mix(in oklab, currentColor 58%, transparent);
		border-radius: 0.15em;
		padding: 0 0.04em;
		background: transparent;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-align: inherit;
		cursor: help;
		transition:
			background-color 140ms ease,
			border-color 140ms ease;
	}

	:global(.project-hover-note:hover),
	:global(.project-hover-note[aria-describedby]) {
		border-bottom-color: currentColor;
		background: color-mix(in oklab, var(--accent) 78%, transparent);
	}

	:global(.project-hover-note:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	.project-hover-tooltip {
		position: fixed;
		z-index: 60;
		visibility: hidden;
		width: max-content;
		max-width: min(20rem, calc(100vw - 1.5rem));
		border: 1px solid color-mix(in oklab, var(--border) 75%, var(--foreground) 25%);
		border-radius: 0.625rem;
		padding: 0.6rem 0.75rem;
		background: var(--popover);
		box-shadow:
			0 14px 34px rgb(0 0 0 / 0.13),
			0 3px 9px rgb(0 0 0 / 0.08);
		color: var(--popover-foreground);
		font-size: 0.8125rem;
		font-weight: 450;
		line-height: 1.45;
		overflow-wrap: anywhere;
		text-wrap: pretty;
		pointer-events: none;
		opacity: 0;
		transform: translateY(2px) scale(0.985);
		transform-origin: center bottom;
	}

	.project-hover-tooltip.positioned {
		visibility: visible;
		opacity: 1;
		transform: translateY(0) scale(1);
		animation: hover-note-in 140ms ease-out;
	}

	.project-hover-tooltip[data-placement='bottom'] {
		transform-origin: center top;
	}

	.project-hover-tooltip::after {
		position: absolute;
		left: var(--tooltip-arrow-left);
		width: 0.5rem;
		height: 0.5rem;
		background: var(--popover);
		content: '';
		transform: translateX(-50%) rotate(45deg);
	}

	.project-hover-tooltip[data-placement='top']::after {
		bottom: -0.3rem;
		border-right: 1px solid color-mix(in oklab, var(--border) 75%, var(--foreground) 25%);
		border-bottom: 1px solid color-mix(in oklab, var(--border) 75%, var(--foreground) 25%);
	}

	.project-hover-tooltip[data-placement='bottom']::after {
		top: -0.3rem;
		border-top: 1px solid color-mix(in oklab, var(--border) 75%, var(--foreground) 25%);
		border-left: 1px solid color-mix(in oklab, var(--border) 75%, var(--foreground) 25%);
	}

	@keyframes hover-note-in {
		from {
			opacity: 0;
			transform: translateY(2px) scale(0.985);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.project-hover-note) {
			transition: none;
		}

		.project-hover-tooltip.positioned {
			animation: none;
		}
	}
</style>

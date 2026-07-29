<script lang="ts">
	import { onMount } from 'svelte';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { ProjectHeading } from '$lib/project-markdown';

	type TocPlacement = 'left' | 'right';

	export let headings: ProjectHeading[] = [];
	export let activeSlugs: string[] = [];
	export let placement: TocPlacement = 'left';

	const preferencesKey = 'project-post-preferences';

	$: firstDepth = headings.length > 0 ? Math.min(...headings.map((heading) => heading.depth)) : 2;
	$: activeSlugSet = new Set(activeSlugs);

	function loadPreferences(): void {
		try {
			const saved = JSON.parse(window.localStorage.getItem(preferencesKey) ?? '{}') as Record<
				string,
				unknown
			>;
			if (saved.tocPlacement === 'left' || saved.tocPlacement === 'right') {
				placement = saved.tocPlacement;
			}
		} catch {
			// Keep the default when storage is unavailable or contains malformed preferences.
		}
	}

	function selectPlacement(nextPlacement: TocPlacement): void {
		if (placement === nextPlacement) return;
		placement = nextPlacement;

		try {
			window.localStorage.setItem(preferencesKey, JSON.stringify({ tocPlacement: placement }));
		} catch {
			// The setting still works for the current page when storage is unavailable.
		}
	}

	onMount(loadPreferences);
</script>

<nav class="project-toc" aria-label="Table of contents">
	<ul>
		{#each headings as heading}
			<li
				aria-level={heading.depth - firstDepth + 1}
				style={`--toc-indent: ${heading.depth - firstDepth}`}
			>
				<a href={`#${heading.slug}`} aria-current={activeSlugSet.has(heading.slug) ? 'true' : undefined}>
					{heading.text}
				</a>
			</li>
		{/each}
	</ul>

	<Dialog.Root>
		<Dialog.Trigger
			class={`${buttonVariants({ variant: 'ghost', size: 'icon' })} project-toc-settings-trigger`}
			aria-label="Project display settings"
		>
			<SlidersHorizontalIcon />
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-sm">
			<Dialog.Header>
				<Dialog.Title>Settings</Dialog.Title>
				<Dialog.Description class="sr-only">
					Configure presentation options for project posts.
				</Dialog.Description>
			</Dialog.Header>

			<fieldset class="grid gap-2">
				<legend class="text-sm font-medium">Position</legend>
				<div class="grid grid-cols-2 gap-2">
					<Button
						variant={placement === 'left' ? 'default' : 'outline'}
						size="sm"
						aria-pressed={placement === 'left'}
						onclick={() => selectPlacement('left')}
					>
						Left
					</Button>
					<Button
						variant={placement === 'right' ? 'default' : 'outline'}
						size="sm"
						aria-pressed={placement === 'right'}
						onclick={() => selectPlacement('right')}
					>
						Right
					</Button>
				</div>
			</fieldset>
		</Dialog.Content>
	</Dialog.Root>
</nav>

<style>
	.project-toc {
		position: sticky;
		top: 5.5rem;
		max-height: calc(100svh - 7rem);
		overflow-y: auto;
		scrollbar-width: thin;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.125rem 0.125rem 0.125rem calc(var(--toc-indent) * 1.125rem + 0.125rem);
		color: var(--muted-foreground);
		font-size: 1rem;
		line-height: 1.5;
		transition: color 150ms ease;
	}

	li[aria-level='1'] {
		font-weight: 500;
	}

	li:has(> a[aria-current='true']),
	ul:hover li {
		color: var(--foreground);
	}

	a {
		border-radius: 0.125rem;
		color: inherit;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
	}

	a:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	:global(.project-toc-settings-trigger) {
		width: 2rem;
		height: 2rem;
		margin-top: 0.375rem;
		margin-left: -0.5rem;
		opacity: 0;
		color: var(--muted-foreground);
		transition: opacity 160ms ease;
	}

	:global(.project-toc-settings-trigger:hover),
	:global(.project-toc-settings-trigger:focus-visible),
	:global(.project-toc-settings-trigger[data-state='open']) {
		opacity: 1;
	}

	@media (max-width: 74.999rem) {
		.project-toc {
			position: static;
			max-height: none;
			margin-bottom: 3rem;
			overflow: visible;
		}

		li {
			position: relative;
			padding-block: 0.15rem;
			padding-left: calc(var(--toc-indent) * 1rem + 1.5rem);
			color: var(--foreground);
		}

		li::before {
			position: absolute;
			left: calc(var(--toc-indent) * 1rem + 0.2rem);
			content: '▪';
		}
	}

	@media (prefers-reduced-motion: reduce) {
		li,
		:global(.project-toc-settings-trigger) {
			transition: none;
		}
	}
</style>

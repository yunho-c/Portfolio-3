<script lang="ts">
	import type { ProjectHeading } from '$lib/project-markdown';

	export let headings: ProjectHeading[] = [];
	export let activeSlugs: string[] = [];

	$: firstDepth = headings.length > 0 ? Math.min(...headings.map((heading) => heading.depth)) : 2;
	$: activeSlugSet = new Set(activeSlugs);
</script>

<nav class="project-toc" aria-label="Table of contents">
	<h2>Table of Contents</h2>
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
</nav>

<style>
	.project-toc {
		position: sticky;
		top: 5.5rem;
		max-height: calc(100svh - 7rem);
		overflow-y: auto;
		scrollbar-width: thin;
	}

	h2 {
		margin: 0 0 1rem;
		color: var(--foreground);
		font-size: 1rem;
		font-weight: 700;
		line-height: 2;
		text-transform: uppercase;
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

	@media (max-width: 74.999rem) {
		.project-toc {
			position: static;
			max-height: none;
			margin-bottom: 3rem;
			overflow: visible;
		}

		h2 {
			margin-bottom: 1rem;
			font-size: 1.5rem;
			line-height: 1.25;
			text-transform: none;
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
		li {
			transition: none;
		}
	}
</style>

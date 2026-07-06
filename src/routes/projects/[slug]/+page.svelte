<script lang="ts">
	import type { PageData } from './$types';
	import { marked } from 'marked';
	import Icon from '@iconify/svelte';
	
	export let data: PageData;
	$: ({ project, content } = data);
	
	$: htmlContent = marked.parse(content || '');
</script>

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
		<div class="prose prose-zinc dark:prose-invert max-w-none prose-img:rounded-xl">
			{@html htmlContent}
		</div>
	</article>
</main>
